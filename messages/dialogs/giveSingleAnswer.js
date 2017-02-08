var builder = require("botbuilder");

// Dictionaries
var glossaryLookup = require('../glossaryLookup');
var qnaDB = require('../dictionaries/glossary');

var makeCompleteGlossaryArticle = require("../makeCompleteGlossaryArticle");

// global variable to pass states between pieces of the dialog
var argsGlobal = {};

module.exports = {
    Label: 'Give single answer',
    Dialog: [
        /*
            To give a single intermediate answer, flow should be as follows
            0. A1 is the answer that applies
            1. give out usr3AnswersDB[A1Key].longText. It will be like "XYZ applies for your case, would you like to know more?"
            2. if answer = 'Ja', then show glossary
            - jump out of the dialog

            therefore, args should contain:
            args =
            {
                longText: "Möchten Sie wissen, wie sich die aktuellen ordentlichen Steuersätze in den Kantonen voraussichtlich ändern?",
                glossary: ["Steuersatzsenkung HL"]
            }

            we obtain args directly from usr3AnswersDB
        */
        function (session, args) {
            argsGlobal = args;
            // long text provided in args? 
            if(argsGlobal.longText) {
                // show it and ask yes/no to show glossary details
                builder.Prompts.choice(session, argsGlobal.longText, "Ja|Nein", {listStyle: 3, retryPrompt: "I verstehe nicht. Bitte antworten 'ja' oder 'nein'."});
            }
        },  
        function (session, results) {
            // ok, user chose to learn more. are there glossary details?
            if (results.response.entity == "Ja" && argsGlobal.glossary && argsGlobal.glossary.length > 0) {
                // loop over related glossary records
                argsGlobal.glossary.forEach((glossaryRecordKey) => {
                    if(qnaDB[glossaryRecordKey]) {     
                        // make complete glossary article here
                        var msg = makeCompleteGlossaryArticle(session, qnaDB[glossaryRecordKey])
                        session.send(msg);
                    }
                }); // foreach ends 
            } 
            else {
                // if user chooses not to display glossary details, we can handle this here
            }
        session.endDialog();
        }
    ]
}
