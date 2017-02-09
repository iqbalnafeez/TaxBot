var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask name',
    Dialog: [
        function (session) {
            session.send('/askName');
            
            var seen = [];
            var sessionString = JSON.stringify(session.sessionState.callstack, function(key, val) {
            if (val != null && typeof val == "object") {
                    if (seen.indexOf(val) >= 0) {
                        return;
                    }
                    seen.push(val);
                }
                return val;
            });
            
            builder.Prompts.text(session, 'Wie lautet Ihre Name?');
        },
        function (session, results) {
            if (results.response) {
                session.privateConversationData.username = results.response;
                session.endDialog("Hallo %s, es freut mich dass Sie den USR III Chatbot nutzen.\n\n\n\nBitte fragen sie mich 'was ist neue steuerreform' oder typpen 'auswirkungen' ein, um zu sehen, was für Auswirkungen die Reform auf Ihre Unternehmen haben kann.", session.privateConversationData.username);
            }
        }
    ]
}
