/*
	This is a small wrapper to return a single heroCard (picture with title, subtitle and link) to the chat
	An array of HeroCards can be fed into the builder.Message(session) as .attachments(HeroCardArray);
	
	function(session, args):
	args should contain string variables: 
		title
		text
		thumbURL
		linkText
		linkURL

	Usage:
	1. include
		// Card maker
		var makeherocard = require('./makeherocard');
	2. call
	    // the found glossary object should contain array called cards
		var foundGlossaryRecord = qnadict["step-up"]
		
		// here we will store a list of HeroCards, one entry is a full HeroCard object with picture etc..
		var HeroCardArray = [];

		// loop through all contained cards and populate the HeroCardArray
		if(foundGlossaryRecord.cards) {
			var cards = foundGlossaryRecord.cards;
			cards.forEach(
				function(card) {
					HeroCardArray.push(makeherocard(session,card))
				})
		};
		
		// the array of HeroCards will be fed into the msg
		var msg = new builder.Message(session)
				.textFormat(builder.TextFormat.xml)
				.attachmentLayout(builder.AttachmentLayout.carousel)
				.attachments(HeroCardArray);

		builder.Prompts.text(session, msg);
*/

module.exports = function(session, args)
{
    var builder = require('botbuilder');


    var heroCard = new builder.HeroCard(session)
        .title(args.title || "").text(args.text || "")
        .images([
            builder.CardImage.create(session, args.thumbURL)
                .tap(builder.CardAction.showImage(session, args.linkURL))
        ])
        .buttons([
            builder.CardAction.openUrl(session, args.linkURL, args.linkText),
        ]);
    
    return heroCard;
}