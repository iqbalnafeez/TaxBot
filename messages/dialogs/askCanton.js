var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask canton',
    Dialog: [
        function (session) {
            if (session.privateConversationData.canton) {
                session.endDialog();
            } else {
                builder.Prompts.text(session, 'In welchem Kanton ist Ihr Unternehmen ansässig?');
            }
        },
        function (session, results) {
            if (results.response) {
                session.privateConversationData.canton = results.response;
                session.endDialog();
            }    
        }
    ]
}
