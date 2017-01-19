var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Close contact form',
    Dialog: [
        function (session) {
             builder.Prompts.text(session, 'Vielen Dank. Möchten Sie noch weiteren Angaben zu Ihnen (Function) und zu ihrem Unternehmen machen?');
        },
        function (session, results) {
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
