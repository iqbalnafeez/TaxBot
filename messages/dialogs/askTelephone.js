var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask telephone',
    Dialog: [
        function (session) {
            builder.Prompts.text(session, 'Vielen Dank. Wie lautet Ihre Telefonnummer?');    
        },
        function (session, results) {
            if (results.response) {
                session.privateConversationData.telephone = results.response;
            }
            builder.Prompts.text(session, 'Vielen Dank. Wann sind Sie am besten erreichbar?');
        },
        function (session, results) {
            if (results.response) {
                session.privateConversationData.callTimes = results.response;
                session.endDialog();
            }    
        }
    ]
}
