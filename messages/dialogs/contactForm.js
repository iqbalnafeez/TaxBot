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
                next();
            }
        },
        function (session) {
            session.endDialog("End. %s", session.privateConversationData.familyname);
        }
    ]
}
