var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask email',
    Dialog: [
        function (session) {
            builder.Prompts.text(session, 'Vielen Dank. Wie lautet Ihre Emailadresse?');
        },
        function (session, results, next) {
            if (results.response) {
                session.privateConversationData.email = results.response;
                session.endDialog();
            }    
        }
    ]
}
