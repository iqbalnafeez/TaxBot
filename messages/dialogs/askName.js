var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask name',
    Dialog: [

        function (session) {
            // Request user name
            builder.Prompts.text(session, 'Wie ist Ihre Name?');
        },
        function (session, results, next) {
            if (results.response) {
                session.send("Have response");
                session.privateConversationData.username = results.response;
                next();
            }
        },
        function (session) {
            session.send("Hallo %s, es freut mich dass Sie den USR III Chatbot nutzen.", session.privateConversationData.username);
            session.endDialog("Was möcten Sie im Zusammenhang mit der USR III wissen?");
        }
    ]
}
