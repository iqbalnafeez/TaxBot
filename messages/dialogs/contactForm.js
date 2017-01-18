var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Contact form',
    Dialog: [
        function (session) {
            builder.Prompts.text(session, 'Wie lautet Ihr Nachname?');
        },
        function (session, results, next) {
            if (results.response) {
                session.privateConversationData.familyname = results.response;
            }
            builder.Prompts.text(session, 'Wie lautet Ihr Vorhname?');
        },
        function (session, results, next) {
            if (results.response) {
                session.privateConversationData.firstname = results.response;
            }
            builder.Prompts.choice(session, 'Vielen Dank. Wünschen Sie eine Kontaktaufnahme per Email oder Telefon?',
                ['Email', 'Telefon'],
                {retryPrompt: "I verstehe nicht. Bitte antworten 'Email' oder 'Telefon'."});
        },
        function (session, results, next) {
            if (results.response) {
                if (results.response.entity=="Telefon") {
                    builder.Prompts.text(session, 'Vielen Dank. Wie lautet Ihre Telefonnummer?');    
                } else if (results.response=="Email") {
                   builder.Prompts.text(session, 'Vielen Dank. Wie lautet Ihre Emailadresse?');    
                }
            }
        },
        function (session, results, next) {
            if (results.response) {
                session.privateConversationData.telephone = results.response;
            }
            builder.Prompts.text(session, 'Vielen Dank. Wann sind Sie am besten erreichbar?');
        },
        function (session, results, next) {
            if (results.response) {
                session.privateConversationData.callTimes = results.response;
            }
            builder.Prompts.text(session, 'Vielen Dank. Möchten Sie noch weiteren Angaben zu Ihnen (Function) und zu ihrem Unternehmen machen?');
        },
        function (session, results, next) {
            if (results.response) {
                session.privateConversationData.other = results.response;
            }
            builder.Prompts.choice(session, "Möchten Sie eine Aufzeichnung dieser Konversation per E-Mail erhalten?", 
            ['Ja', 'Nein'],
            {retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
        },
        function (session, results, next) {
            if (results.response) {
                session.send('Have response');
                next();
            }
        },
        function (session) {
            session.endDialog("Vielen Dank %s für die Nutzung des USR III Chatbot. In Kürze wird Sie einer Steuerfachpersonen kontaktieren. Ich wünsche Ihnen einen schönen Tag.", session.privateConversationData.username);
        }
    ]
}
