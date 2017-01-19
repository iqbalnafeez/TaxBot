var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Contact form',
    Dialog: [
        function (session) {
            builder.Prompts.text(session, 'Wie lautet Ihr Nachname?');
        },
        function (session, results) {
            if (results.response) {
                session.privateConversationData.familyname = results.response;
            }
            builder.Prompts.text(session, 'Wie lautet Ihr Vorhname?');
        },
        function (session, results) {
            if (results.response) {
                session.privateConversationData.firstname = results.response;
            }
            builder.Prompts.choice(session, 'Vielen Dank. Wünschen Sie eine Kontaktaufnahme per Email oder Telefon?',
                ['Email', 'Telefon'],
                {retryPrompt: "I verstehe nicht. Bitte antworten 'Email' oder 'Telefon'."});
        },
        function (session, results) {
            session.endDialogWithResult(results.response);
        }
    ]
}
