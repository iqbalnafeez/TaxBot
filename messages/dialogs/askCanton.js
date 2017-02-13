var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

module.exports = {
    Label: 'Ask canton',
    Dialog: [
        function (session) {
            if (session.privateConversationData.canton) {
                session.endDialog();
            } else {
                builder.Prompts.choice(session, 'In welchem Kanton ist Ihr Unternehmen ansässig?','Zürich|Bern|Luzern|Uri|Schwyz|Obwalden|Nidwalden|Glarus|Zug|Freiburg|Solothurn|Basel-Stadt|Basel-Landschaft|Schaffhausen|Appenzell A. Rh.|Appenzell I. Rh.|St. Gallen|Graubünden|Aargau|Thurgau|Tessin|Waadt|Wallis|Neuenburg|Genf|Jura',  {listStyle: 3});
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
