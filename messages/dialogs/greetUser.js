var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Greet user',
    Dialog: [
        function (session, args,  next) {
            var user = builder.EntityRecognizer.findEntity(args.entities, 'User');
            if (user) { // utterance contained a name, update name if necessary
                session.privateConversationData.username = user.entity;
            }
            session.send("Hallo %s, es freut mich dass Sie den USR III Chatbot nutzen.", session.privateConversationData.username);
            session.endDialog("Was möcten Sie im Zusammenhang mit der USR III wissen?");
        }
    ]
}
