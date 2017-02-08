var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Contact form',
    Dialog: [
        function (session) {
            session.send("Ich möchte jetzt Ihre Kontaktdaten sammeln.");
            builder.Prompts.text(session, 'Wie lautet Ihre Vollname?');
        },
        function (session, results) {
            session.privateConversationData.fullname = results.response;
            builder.Prompts.text(session, 'Wie und wann kann KPMG Sie kontaktieren? Sie können einfach schreiben "Dienstag Morgens, Natel 078 888 33 99" oder "Jederzeit mein.email@meine.firma" oder beide.');
        },
        function (session, results) {
            session.privateConversationData.fullcontact = results.response;
            session.endDialog("Vielen Dank %s für die Nutzung des USR III Chatbot. In Kürze wird Sie einer Steuerfachpersonen kontaktieren. Ich wünsche Ihnen einen schönen Tag.", session.privateConversationData.username);
        }
    ]
}
