/*
    this module allows to fuzzy match the glossary synonyms and return the full object (including long text) for the synonym
*/

// Dictionaries
var qnaDict = require('./dictionaries/qnadict');

// to read and write JSON file 
var fs = require('fs');

// recognize human input
var didYouMean2 = require("didyoumean2");

////////////////////////////////////////////////////////////////////////////////

// this was used to convert our original js object to JSON file and write the JSON file
var parseObjectFromJSFileAndWriteToJSON = function() {
    // Start looping through the object
    var keys = Object.keys(qnaDict);

    // Collect all keys and values, and convert them to new format

    var qnaArray = [];

    for(key in keys) {
        var qnaSingleObject = {};
        qnaSingleObject.name = "";
        qnaSingleObject.synonyms = [];
        qnaSingleObject.longText = "";
        qnaSingleObject.cards = [];

        qnaSingleObject.synonyms.push(keys[key]);
        qnaSingleObject.name = keys[key];
        qnaSingleObject.longText = qnaDict[keys[key]];

        qnaArray.push(qnaSingleObject);
    }

    // format JSON pretty print
    var JSONString = JSON.stringify(qnaArray, null, 4);

    // write to this file
    var outputFilename = './qnadict.json';

    fs.writeFile(outputFilename, JSONString, function(err) {
        if(err) {
        console.log(err);
        } else {
        console.log("JSON saved to " + outputFilename);
        }
    });

    var fromJSONtoObj =  JSON.parse(JSON.stringify(qnaArray));
};

////////////////////////////////////////////////////////////////////////////////

// read our JSON file and look up synonyms
var lookUpValueInJSONFile = function(JSONfilePath, textToFind) {
  
    var contents = fs.readFileSync(JSONfilePath);
    var jsonContent = JSON.parse(contents);
    
    console.log('looking for', textToFind);

    var allsynonyms = [];
    // key is needed to link many synonyms to single key
    // as a result, in synonymsAndKeys we will have a complete list of keywords
    for(key in jsonContent) {
        var qnaSingleObject = jsonContent[key];
        allsynonyms = allsynonyms.concat(qnaSingleObject.synonyms);
    }

    var match = didYouMean2(textToFind, allsynonyms);

    // now we have the match, and we need to get back from synonym to definition
    var foundRecord = findRecordContainingSynonym(jsonContent, match)
    return foundRecord?foundRecord:null;
}

// a helper function to return record with a synonym
var findRecordContainingSynonym = function(jsonContent, synonymToFind) {

    var foundObject = {};
    // loop over the object, find key and value for args
    for(key in jsonContent) {
        var qnaSingleObject = jsonContent[key];
        foundObject = qnaSingleObject.synonyms.find(synonymValue => {
            return synonymValue == synonymToFind
        });
        if(foundObject) {break};
    }
    return foundObject?qnaSingleObject:null;
}

var JSONfilePath = './qnadict.json';
var textToFind = 'patenbox';
var foundObject = lookUpValueInJSONFile(JSONfilePath, textToFind);

console.log(foundObject.name);
console.log(foundObject.longText);
