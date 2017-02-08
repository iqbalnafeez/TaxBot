/*
    Input: full glossary article object -- found at previous step by glossaryLookup
    Output: message and herocard attachments
*/

module.exports = function(session, foundGlossaryArticle)
{
    var builder = require('botbuilder');
    var makeherocard = require('./makeherocard');
    // Path to folder with images
    const pathToImages = 'http://kpmgvirtualtaxadvisor.azurewebsites.net/images/';


    // here we will store a list of HeroCards (pictures) related to the glossary article
    var HeroCardArray = [];

    // loop through all contained cards and populate the HeroCardArray - if there are any cards attached to glossary article
    if(foundGlossaryArticle.cards && foundGlossaryArticle.cards.length > 0) {
        var cards = foundGlossaryArticle.cards;
        cards.forEach(
            function(card) {
                var args = {};
                args.thumbURL = pathToImages + card;
                args.linkURL = pathToImages + card;
                args.linkText = 'Bild vergrössern';
                HeroCardArray.push(makeherocard(session,args))
            });
    };

    // create message
    var msg = new builder.Message(session)
        .textFormat(builder.TextFormat.xml)
        .text(foundGlossaryArticle.longText)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(HeroCardArray);
    
    return msg;

}