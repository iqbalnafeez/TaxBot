var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask name',
    Dialog: [
        function (session, args,  next) {
            var user = builder.EntityRecognizer.findEntity(args.entities, 'User');
            if (user) { // utterance contained a name
                session.privateConversationData.username = user.entity;
            }
            if (!session.privateConversationData.username) { // Does not have name from earlier in the conversation or through the LUIS utterance
                    builder.Prompts.text(session, 'Wie ist Ihre Name?');
            } else {
                session.endDialog("Upper ending");
            }
        },
        function (session, results, next) {
            if (results.response) {
                session.privateConversationData.username = results.response;
                session.send("Have response");
                next();
            }
        },
        function (session) {
            session.send("Hallo %s, es freut mich dass Sie den USR III Chatbot nutzen.", session.privateConversationData.username);
            session.endDialog("Was möcten Sie im Zusammenhang mit der USR III wissen?");
        }
    ]
}
