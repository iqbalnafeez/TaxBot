/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var didYouMean = require("didyoumean2");

// Dictionaries
var qnadict = require('./dictionaries/qnadict');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});
//var connector = new builder.ConsoleConnector(); // local debugging
var bot = new builder.UniversalBot(connector);

// Configure bots default locale and locale folder path.
bot.set('localizerSettings', {
    botLocalePath: "./locale", 
    defaultLocale: "de" 
});

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey + '&verbose=true';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Dialogs
var di_askName = require('./dialogs/askName');
var di_greetUser = require('./dialogs/greetUser');
var di_contactForm = require('./dialogs/contactForm');

bot.dialog('/askName', di_askName.Dialog);
bot.dialog('/greetUser', di_greetUser.Dialog);
bot.dialog('/contactForm', di_contactForm.Dialog);

// Starting a new conversation will trigger this message
bot.on('conversationUpdate', 
    function (message) {
        if (message.membersAdded) {
            message.membersAdded.forEach((identity) => {
            if (identity.id === message.address.bot.id) {
                var instructions = 'Grüezi! Ich bin der KPMG Virtual Tax Advisor, der USR III Chatbot.';
                var reply = new builder.Message()
                    .address(message.address)
                    .text(instructions);
                bot.send(reply);
//                bot.beginDialog(message.address, '/'); // start the root dialog
            }
            });
        }
    }
);

intents.onBegin(function (session) {
    session.privateConversationData.familyname = "";
    session.privateConversationData.firstname = "";
    session.privateConversationData.company = "";
    session.privateConversationData.position = "";
    session.privateConversationData.email = "";
    session.privateConversationData.telephone = "";
    session.privateConversationData.callTimes = "";
    session.privateConversationData.other = "";
    session.privateConversationData.canton = "";
    session.privateConversationData.rechnungslegung = "";
    session.privateConversationData.latenteSteuern = "";
    session.privateConversationData.steuerStatus = "";
    session.privateConversationData.stilleReserven = "";
    session.privateConversationData.gewinnErwartet = "";
    session.privateConversationData.patents = "";
    session.privateConversationData.IP_CH = "";
    session.privateConversationData.IP_Foreign3rdParty = "";
    session.privateConversationData.FE_CH = "";
    session.privateConversationData.eigenfinanzierung = "";
    session.privateConversationData.aktivdarlehenGruppengesellschaften = "";
    if (!session.privateConversationData.username) {
        session.beginDialog('/askName');
    }
});

intents.matches(/^version/i, function (session) {
    session.send('Bot version 0.1');
});

intents.matches(/^askName/i, function (session) {
    session.beginDialog('/askName');
});

intents.matches(/^contactForm/i, function (session) {
    session.beginDialog('/contactForm');
});

intents.matches(/^user/i, function (session) {
    session.send('You are %s.', session.privateConversationData.username);
});

intents.matches('Greet', function (session, args) {
    session.beginDialog('/greetUser', {entities:args.entities})
});

intents.matches('QnA', [
    function (session, args) {
        var topic = builder.EntityRecognizer.findEntity(args.entities, 'Topic');
        console.log(topic);
        var keys = Object.keys(qnadict);
        var bestMatch = didYouMean(topic.entity, keys);
        console.log(bestMatch);
        session.send('Sie möchten wissen was %s meint? Moment bitte, ich suche ein Antwort führ Sie.', bestMatch);
        session.send(qnadict[bestMatch]);
    }
]);

intents.matches("Help", [
    function (session) {
        session.send('Ob Sie nicht die Terminologie verstehen können Sie mir fragen. Zum Beispiel, "Was ist BEPS" schaut eine Erklärung für "BEPS". "QnA" schaut die Inhaltverzeichnis was ich erklären kann.');
    }
]);

intents.matches(/^qna/i, function (session) {
    session.send('Hier ist meine Inhaltverzeichnis: %s', Object.keys(qnadict));
});

intents.onDefault([(session) => {
        session.send("Dies kann ich Ihnen leider nicht beantworten. Bitte beachten Sie, dass dieser ChatBot auf Fragen zur Unternehmenssteuerreform III (USR III) limitiert ist.");
        builder.Prompts.choice(session, "Darf einer unserer Steuerfachpersonen Sie diesbezüglich kontaktieren?", 
            ['Ja', 'Nein'],
            {retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
    }, 
    function (session, results) {
        if (results.response) {
            if (results.response.entity == 'Ja') {
                session.replaceDialog('/contactForm');
            } else if (results.response.entity == 'Nein') {
                session.endDialog();
            }
        }
    }
]);

bot.dialog('/', intents);    

if (useEmulator) {
    // Set up restify server
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, function(){
        console.log('%s listening to %s', server.name, server.url);
    });
    server.post('/api/messages', connector.listen());    
    connector.listen(); // terminal connector
} else {
    module.exports = { default: connector.listen() }
}

