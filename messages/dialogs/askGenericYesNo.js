var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask Generic Yes No',
    Dialog: [
        function (session, args) {
            // why usr3Questions currentQuestionKey should be empty??????
            if (session.privateConversationData.usr3Questions[session.privateConversationData.currentQuestionKey] !== '') {
                session.endDialog();
            } else {
                builder.Prompts.choice(session, args.prompt, "Ja|Nein", {listStyle: 3, retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
            }
        },  
        function (session, results) {
            if (results.response) {
                // session.privateConversationData.usr3Questions will have true or false
                session.privateConversationData.usr3Questions[session.privateConversationData.currentQuestionKey] = results.response.entity == "Ja";
                session.endDialog();
            }
        }
    ]
}
