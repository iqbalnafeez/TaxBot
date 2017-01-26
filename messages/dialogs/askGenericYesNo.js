var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask Generic Yes No',
    Dialog: [
        function (session, args) {
            if (session.privateConversationData.usr3questions[session.privateConversationData.currentQuestionKey] !== '') {
                session.endDialog();
            } else {
                builder.Prompts.choice(session, args.prompt,
                    ['Ja', 'Nein'],
                    {retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
            }
        },  
        function (session, results) {
            if (results.response) {
                session.privateConversationData.usr3questions[session.privateConversationData.currentQuestionKey] = results.response.entity == "Ja";
                session.endDialog();
            }
        }
    ]
}
