module.exports = function (topicToFind, objectToLookIn) {
    // load fuzzy lookup library
    var didYouMean = require("didyoumean2");

    // get all synonyms from every record
    var allSynonyms = [];
    for(singleObjectKey in objectToLookIn)
    {
        allSynonyms = allSynonyms.concat(objectToLookIn[singleObjectKey].synonyms);
    }

    // perform fuzzy search over all synonyms - return bestMatch
    var bestMatch = didYouMean(topicToFind,allSynonyms);

    // use bestMatch to look up the object by synonym
    for(singleObjectKey in objectToLookIn)
    {
        for(synonymKey in objectToLookIn[singleObjectKey].synonyms) {
            if(objectToLookIn[singleObjectKey].synonyms[synonymKey]==bestMatch) {
                var foundObject = {};
                // return the key and contents of the object in the glossary
                foundObject.key = singleObjectKey;
                foundObject.object = objectToLookIn[singleObjectKey];
                return foundObject
            }
        }
    }    
};
