//////////////////////////////////////////////////////////////////////
/// KPMG Tax Bot                                                   /// 
/// Authors: rikard.sandstrom@gmail.com, igor.zhilin@gmail.com     ///  
/// The bot is designed to answer questions about the Swiss        ///
/// corporate tax reform using KPMG's deep knowledge of the topic. ///
//////////////////////////////////////////////////////////////////////

"use strict";

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var azure = require('azure-storage');
var didYouMean = require("didyoumean2");

// Dictionaries
var glossaryLookup = require('./glossaryLookup');

var qnaDB = require('./dictionaries/glossary');
var usr3QuestionsDB = require('./dictionaries/usr3questions');
var usr3AnswersDB = require('./dictionaries/usr3answers');

// helper to create herocards
var makeherocard = require('./makeherocard');

// Path to folder with images
const pathToImages = 'http://kpmgvirtualtaxadvisor.azurewebsites.net/images/';

// Connection to a remote NoSQL database Azure Table Storage
var tableName = 'TaxBotStore';
var tableSvc = azure.createTableService();
tableSvc.createTableIfNotExists(tableName, function(error, result, response){
  if(!error){
    // Table exists or created
  }
});

var entGen = azure.TableUtilities.entityGenerator;

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
var di_askGenericYesNo = require('./dialogs/askGenericYesNo');
var di_askName = require('./dialogs/askName');
var di_askContactNames = require('./dialogs/askContactNames');
var di_askCanton = require('./dialogs/askCanton');
var di_giveSingleAnswer = require('./dialogs/giveSingleAnswer');

bot.dialog('/askGenericYesNo', di_askGenericYesNo.Dialog);
bot.dialog('/askName', di_askName.Dialog);
bot.dialog('/askContactNames', di_askContactNames.Dialog);
bot.dialog('/askCanton', di_askCanton.Dialog);
bot.dialog('/giveSingleAnswer', di_giveSingleAnswer.Dialog);

 // workaround for azure
var botAdded = false;

// store reusable texts in a single place
var dialogPrompts = {}
dialogPrompts["/"] = {
    entryPrompt:"Sie können mir Fragen zu Elementen der USR III oder zu Begriffen im Zusammenhang mit der USR III stellen. Gerne können wir aber auch gemeinsam analysieren, inwiefern die USR III Auswirkungen auf Ihr Unternehmen haben wird. Geben Sie für letzteres einfach Auswirkungen ins Eingabefeld ein.<br>&nbsp;<br>Ich freue mich auf das Gespräch mit Ihnen.", exitPrompt: "Bye"
}

// Starting a new conversation will trigger this message
// updating following the guidance from MS
bot.on('conversationUpdate', 
    function (message) {

        // is this system message that the bot joined?
        // we expect the bot to show up first, and this should trigger the message
        if (message.membersAdded[0].id != message.address.bot.id) {
            // if it's not the bot, ignore the whole 'conversationUpdate'          
            return; // !!! this still does not work on the higly async web chat, and the code after return is executed nonetheless !!!
        };

        var greetingText = 'Grüezi! Ich bin der KPMG Virtual Tax Advisor. Gerne unterstütze ich Sie bei Unklarheiten im Zusammenhang mit der Unternehmenssteuerreform III (USR III).<br>&nbsp;<br>' + dialogPrompts["/"].entryPrompt;

        var reply = new builder.Message()
            .textFormat(builder.TextFormat.xml)
            .address(message.address)
            .text(greetingText);

        bot.send(reply);

        bot.beginDialog(message.address, '/');

});

/*
#### ##    ## #### ######## 
 ##  ###   ##  ##     ##    
 ##  ####  ##  ##     ##    
 ##  ## ## ##  ##     ##    
 ##  ##  ####  ##     ##    
 ##  ##   ###  ##     ##    
#### ##    ## ####    ##    
*/

intents.onBegin(function (session) {
    if (!session.privateConversationData.existingSession) {
        session.privateConversationData.existingSession = true;
        session.privateConversationData.usr3dialogPresented = false;
        
        // new variables for simplified contact entry: 
        session.privateConversationData.fullname = "";
        session.privateConversationData.fullcontact = "";

        session.privateConversationData.canton = "";

        // usr3Questions are the USER'S ANSWERS (e.g. holding = true/false) to the questions in Auswirkungen dialog
        session.privateConversationData.usr3Questions = {};
        
        // usr3Answers are the BOT'S ANSWERS corresponding to combinations of USER'S ANSWERS
        session.privateConversationData.usr3Answers = {};

        // create variables that will hold user's answers true/false, set them to empty
        Object.keys(usr3QuestionsDB).forEach(function (key) {
            session.privateConversationData.usr3Questions[key] = "";
        });

        // create variables that will hold bot's detailed answers
        Object.keys(usr3AnswersDB).forEach(function (key) {
            session.privateConversationData.usr3Answers[key] = {presented: false, active: false};
        });

        session.beginDialog('/askName');
        
    } else {

        // !!!!!!!!!!!!!!!! here we need to start a general dialog (show me glossary or effects ????)
        session.send("Was mehr möchten Sie wissen im Zusammenhang mit der USR III?");
    }
});

bot.dialog('/contactForm', [
    function (session) {
        session.beginDialog('/askContactNames');
    },
    function(session){
        var row = {
            PartitionKey: entGen.String(session.message.user.id),
            RowKey: entGen.String(session.message.address.conversation.id),
            timestamp: entGen.DateTime(new Date()),
            fullname: entGen.String(session.privateConversationData.fullname),
            fullcontact: entGen.String(session.privateConversationData.fullcontact),
            canton: entGen.String(session.privateConversationData.canton),
            holding: entGen.String(session.privateConversationData.usr3Questions.holding),
            stilleReserven: entGen.String(session.privateConversationData.usr3Questions.stilleReserven),
            patents: entGen.String(session.privateConversationData.usr3Questions.patents),
            IP_CH: entGen.String(session.privateConversationData.usr3Questions.IP_CH),
            eigenfinanzierung: entGen.String(session.privateConversationData.usr3Questions.eigenfinanzierung),
            FE_CH: entGen.String(session.privateConversationData.usr3Questions.FE_CH),
            IP_Foreign3rdParty: entGen.String(session.privateConversationData.usr3Questions.IP_Foreign3rdParty),
            vermoegen: entGen.String(session.privateConversationData.usr3Questions.vermoegen)
        };
        tableSvc.insertEntity(tableName, row, function (error, result, response) {
            if(!error){
                // Entity inserted
                console.log("Successfully inserted contact details");
                console.log(row);
            } else {
                console.log("Could not insert contact details");
            }
        });
    }
]);

// replies are collected in session.privateConversationData.usr3Answers
// depending on the combinations of collected replies, e.g. Q1=yes, Q2=no => 'Latente Steuern'...
// finds a relevant reply in usr3AnswersDB
bot.dialog('/replyUSR3', [
    function (session) {
        session.privateConversationData.currentAnswerKey = "";
        var key = 'ordSteuersaetze';
        /*
            this question applies at all times
        */        
        if (session.privateConversationData.canton
            && !session.privateConversationData.usr3Answers[key].presented) {
            
            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };

        var key = 'auswirkungLatenteSteuern';
        /*
            holding =                   yes
            latente steuern =           yes
        */
        if (session.privateConversationData.usr3Questions.rechnungslegungIFRS 
            && session.privateConversationData.usr3Questions.latenteSteuern
            && !session.privateConversationData.usr3Answers[key].presented) {

            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };
        var key = 'altrechtlicherStepup';
        /*
            holding =                   yes
            stille reserven =           yes
            stille reserven gewinn =    no
        */
        if (session.privateConversationData.usr3Questions.holding 
            && session.privateConversationData.usr3Questions.stilleReserven
            && !session.privateConversationData.usr3Questions.stilleReservenGewinn
            && !session.privateConversationData.usr3Answers[key].presented) {

            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };
        var key = 'neurechtlicherStepup';
        /*
            holding =                   yes
            stille reserven =           yes
            stille reserven gewinn =    yes
        */
        if (session.privateConversationData.usr3Questions.holding 
            && session.privateConversationData.usr3Questions.stilleReserven
            && session.privateConversationData.usr3Questions.stilleReservenGewinn
            && !session.privateConversationData.usr3Answers[key].presented) {

            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };
        var key = 'patentbox';
        /*
            patente =                   yes
            IP CH =                     yes 
                OR 
            IP Foreign =                yes
        */        
        if (session.privateConversationData.usr3Questions.patents 
            && (session.privateConversationData.usr3Questions.IP_CH || session.privateConversationData.usr3Questions.IP_Foreign3rdParty)
            && !session.privateConversationData.usr3Answers[key].presented) {
                
            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };
        var key = 'feMehrfachabzug';
        /*
            F&E in CH =                 yes
        */          
        if (session.privateConversationData.usr3Questions.FE_CH 
            && !session.privateConversationData.usr3Answers[key].presented) {
                
            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };
        var key = 'nidSpecial';
        /*
            eigenkapital =              yes
            vermoegen nicht betrieb =   no
        */          
        if (session.privateConversationData.usr3Questions.eigenfinanzierung 
            && !session.privateConversationData.usr3Questions.vermoegen
//            && session.privateConversationData.usr3Questions.aktivdarlehen
            && !session.privateConversationData.usr3Answers[key].presented) {
                
            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };
        var key = 'nidCommon';
       
        if (session.privateConversationData.usr3Questions.eigenfinanzierung 
            && !session.privateConversationData.usr3Questions.vermoegen
            && !session.privateConversationData.usr3Questions.aktivdarlehen
            && !session.privateConversationData.usr3Answers[key].presented) {
                
            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };
        var key = 'erleichtungKapitalsteuer';
        /*
            patente =                   yes
                OR
            vermoegen nicht betrieb =   yes
        */            
        if ( (session.privateConversationData.usr3Questions.patents
            || session.privateConversationData.usr3Questions.vermoegen)
            && !session.privateConversationData.usr3Answers[key].presented) {
                
            session.privateConversationData.usr3Answers[key].active = true;
            session.privateConversationData.usr3Answers[key].presented = true;
            
            // answer applies, so we give the answer and output the related glossary
            var args = usr3AnswersDB[key];
            session.beginDialog('/giveSingleAnswer', args);

        };

        // if we reach here, no answer was found

    }
]);

bot.dialog('/askUSR3Questions', [
    function (session) {
        session.beginDialog('/askUSR3IntroQuestions');
    },
    function (session) {
        session.beginDialog('/replyUSR3');
    }, 
    // /// // // / / / ///// // / //// // /// // // / / / ///// // / //// // /// // // / / / ///// // / //// // /// // // / / / ///// // / //// 
    // HERE we should have another prompt: Continue - yes / no
    function (session) {
        var prompt = "Möchten Sie weiter analysieren und Fragen über stille Reserven beantworten?"
        builder.Prompts.choice(session, prompt, "Ja|Nein", {listStyle: 3, retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
    },
    function (session, results) {
        if (results.response.entity != 'Ja') {
            session.send(dialogPrompts["/"].entryPrompt);
            session.replaceDialog('/');
        }
        else {
            // ask next questions
            session.beginDialog('/askUSR3StepUpQuestions');
        }
    },
    // /// // // / / / ///// // / //// // /// // // / / / ///// // / //// // /// // // / / / ///// // / //// // /// // // / / / ///// // / //// 
    function (session) {
        session.beginDialog('/replyUSR3');
    }, 
        function (session) {
        var prompt = "Möchten Sie weiter analysieren und Fragen über Patente und IP beantworten?"
        builder.Prompts.choice(session, prompt, "Ja|Nein", {listStyle: 3, retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
    },
    function (session, results) {
        if (results.response.entity != 'Ja') {
            session.send(dialogPrompts["/"].entryPrompt);
            session.replaceDialog('/');
        }
        else {
            // ask next questions
            session.beginDialog('/askUSR3IPQuestions');
        }
    },
    function (session) {
        session.beginDialog('/replyUSR3');        
    }, 
        function (session) {
        session.beginDialog('/replyUSR3');
    }, 
        function (session) {
        var prompt = "Möchten Sie weiter analysieren und Fragen über kalkulatorischen Zinsabzug beantworten?"
        builder.Prompts.choice(session, prompt, "Ja|Nein", {listStyle: 3, retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
    },
    function (session, results) {
        if (results.response.entity != 'Ja') {
            session.send(dialogPrompts["/"].entryPrompt);
            session.replaceDialog('/');
        }
        else {
            // ask next questions
            session.beginDialog('/askUSR3NIDQuestions');
        }
    }, 
    function (session) {
        session.beginDialog('/replyUSR3');
    }, 
    function (session) {        
        session.replaceDialog('/');
    }
]);

bot.dialog('/askUSR3IntroQuestions', [
    function(session) {
        session.privateConversationData.usr3dialogPresented = true;
        session.send('Um die Auswirkungen der USR3 für Ihre Unternehmen genauer zu beurteilen, werde ich Sie einige Serien Fragen stellen.');
        session.beginDialog('/askCanton');
    },
    function (session) {
        session.privateConversationData.currentQuestionKey = "rechnungslegungIFRS";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },
    function (session) {
        session.privateConversationData.currentQuestionKey = "latenteSteuern";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    }
]);

bot.dialog('/askUSR3StepUpQuestions', [
    function (session) {
        session.privateConversationData.currentQuestionKey = "holding";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },
    function (session) {
        session.privateConversationData.currentQuestionKey = "stilleReserven";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },
    function (session) {
        session.privateConversationData.currentQuestionKey = "stilleReservenGewinn";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    }
]);

bot.dialog('/askUSR3IPQuestions', [
    function (session) {
        session.privateConversationData.currentQuestionKey = "patents";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },  
    function (session) {
        session.privateConversationData.currentQuestionKey = "IP_CH";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },  
    function (session) {
        session.privateConversationData.currentQuestionKey = "IP_Foreign3rdParty";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },
    function (session) {
        session.privateConversationData.currentQuestionKey = "FE_CH";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    }  
]);

bot.dialog('/askUSR3NIDQuestions', [
    function (session) {
        session.privateConversationData.currentQuestionKey = "eigenfinanzierung";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },  
    function (session) {
        session.privateConversationData.currentQuestionKey = "vermoegen";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    },  
    function (session) {
        session.privateConversationData.currentQuestionKey = "aktivdarlehen";
        session.beginDialog('/askGenericYesNo', {key: session.privateConversationData.currentQuestionKey, 
            prompt: usr3QuestionsDB[session.privateConversationData.currentQuestionKey]});
    }
]);

bot.dialog('/promptContactForm', [
    function (session) {
        builder.Prompts.choice(session, "Darf einer unserer Steuerfachpersonen Sie diesbezüglich kontaktieren?", "Ja|Nein", {listStyle: 3, retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
    }, 
    function (session, results) {
        if (results.response) {
            if (results.response.entity == 'Ja') {
                session.replaceDialog('/contactForm');
            } else if (results.response.entity == 'Nein') {
                session.send("Kann ich Ihnen bei einer weiteren Frage betreffend USTR III behilflich sein?");
            }
        }
    }
]);

bot.dialog('/promptUSR3Effects', [
    function (session) {
        builder.Prompts.choice(session, "Möchten Sie wissen welche auswirkungen die USR III kann haben auf Ihre Unternehmen?", "Ja|Nein", {listStyle: 3, retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
    }, 
    function (session, results) {
        if (results.response) {
            if (results.response.entity == 'Ja') {
                session.replaceDialog('/askUSR3Questions');
            } else if (results.response.entity == 'Nein') {
                session.beginDialog('/promptContactForm');
            }
        }
    }
]);

intents.matches(/^version/i, function (session) {
    session.send('Bot version 0.1');
});

intents.matches(/^contactForm/i, function (session) {
    session.beginDialog('/contactForm');
});

intents.matches(/^user/i, function (session) {
    session.send('You are %s.', session.privateConversationData.username);
});

intents.matches('Greet', function (session, args) {
    session.beginDialog('/greetUser', {entities:args.entities});
});

// ?????????????????? Possible to add another step to QnA dialog, so that there is next()????????????????? what gives???????????????????
intents.matches('QnA', [
    function (session, args, next) {
        // LUIS recognizes wording like 'was ist ****' and brings it back under the name of Topic
        // we can manage the topic recognizing logic on LUIS portal
        
        // Problem with LUIS: it recognizes EACH WORD AS SEPARATE TOPIC: if you type "neue steuerreform", it will find "neue" und "steuer"
        // so we need to merge all topics into one string 
        var topic = ""

        for(var topicKey in args.entities) {
            if(args.entities[topicKey].type = 'Topic') {
                topic += " " + args.entities[topicKey].entity;
            }
        }
        topic = topic.trim();

        // look up the word returned by LUIS in the glossary using our fuzzy lookup function
        var foundGlossaryArticle = glossaryLookup(topic, qnaDB);

        // if article not found, just end the dialog and return to parent
        if(!foundGlossaryArticle) {
            session.endDialog('Leider weiss ich nicht, was es meint. Bitte fragen Sie mir etwas über die Reform.');
            // force to return, because even tho i call endDialog() above, function execution continues down below, which is not desired
            session.replaceDialog('/');
            return;
        }

		// here we will store a list of HeroCards, one entry is a full HeroCard object with picture etc..
		var HeroCardArray = [];

		// loop through all contained cards and populate the HeroCardArray - if there are any cards attached to glossary article
		if(foundGlossaryArticle.object.cards && foundGlossaryArticle.object.cards.length > 0) {
			var cards = foundGlossaryArticle.object.cards;
			cards.forEach(
				function(card) {
                    var args = {};
                    args.thumbURL = pathToImages + card;
                    args.linkURL = pathToImages + card;
                    args.linkText = 'Bild vergrössern';
					HeroCardArray.push(makeherocard(session,args))
				});
            // create message
		    var msg = new builder.Message(session);                
            msg.textFormat(builder.TextFormat.xml)
			msg.attachmentLayout(builder.AttachmentLayout.carousel)
			msg.attachments(HeroCardArray);
		};

        session.send('Sie möchten wissen was %s meint? Moment bitte, ich suche ein Antwort für Sie.', foundGlossaryArticle.key);
        session.send(foundGlossaryArticle.object.longText);
        if(msg) {
            session.send(msg);
        };
    }, // first QnA question ends
    function (session, results) {
        session.endDialog("Danke für Ihre Fragen.")
    }
]);

// Trigger example: Welche auswirkungen hat die USRIII auf mein Unternehmen
intents.matches('EffectsOfUSR3', [
    function (session) {
        session.beginDialog('/askUSR3Questions');
    }
]);

intents.matches("Help", [
    function (session) {
        session.send('Wann Sie nicht die Terminologie verstehen können Sie mir fragen. Zum Beispiel, "Was ist BEPS" schaut eine Erklärung für "BEPS". "QnA" schaut die Inhaltverzeichnis was ich erklären kann.');
    }
]);

intents.matches(/^qna/i, function (session) {
    session.send('Hier ist meine Inhaltverzeichnis: %s', Object.keys(qnaDB));
});

intents.onDefault([(session) => {         
    // Ignore LUIS and handle the message directly in the bot
    // if we type auswirk, it will jump us into Auswirkungen dialog
    var patternAuswirkungen = /.*auswirk.*/i
    if (patternAuswirkungen.test(session.message.text))    {
        if(!session.privateConversationData.usr3dialogPresented) {
            session.replaceDialog('/askUSR3Questions');
        }
        else {
            session.beginDialog('/promptContactForm');
        }
    }
    else {
        session.beginDialog('/promptUSR3Effects');
    }
}]);

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

