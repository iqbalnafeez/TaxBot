/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
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

var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey + '&verbose=true';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Starting a new conversation will trigger this message
bot.on('conversationUpdate', function (message) {
    var instructions = 'Willkommen nach KPMG! Ich bin Ihre Virtual Tax Advisor.';
    var reply = new builder.Message()
        .address(message.address)
        .text(instructions);
    bot.send(reply);
});

intents.matches(/^version/i, function (session) {
    session.send('Bot version 0.1');
});

intents.matches(/^user/i, function (session) {
    session.send('You are %s.', session.privateConversationData.username);
});

intents.matches('Greet', [
    function (session, args, next) {
        var user = builder.EntityRecognizer.findEntity(args.entities, 'User');
        console.log(user);
        if (user) { // utterance contained a name
            session.privateConversationData.username = user.entity;
        } else {
            session.send('no name');
            //session.beginDialog('/askName');
        }
        session.send('Howdy %s!', session.privateConversationData.username);
    }
]);

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
        //builder.DialogAction.send('This is a help message')
    }
]);

intents.matches(/^qna/i, function (session) {
    session.send('Hier ist meine Inhaltverzeichnis: %s', Object.keys(qnadict));
});

intents.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

