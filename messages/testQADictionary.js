/*
    convert our original glossary into JSON
*/

// Dictionaries
var qnaDict = require('./dictionaries/qnadict');

// to write JSON file 
var fs = require('fs');

////////////////////////////////////////

// Start looping through the object
var keys = Object.keys(qnaDict);

// Collect all keys and values, and convert them to new format

var qnaArray = [];

for(key in keys) {
    var qnaSingleObject = {};
    qnaSingleObject.synonims = [];
    qnaSingleObject.longText = "";
    qnaSingleObject.cards = [];

    qnaSingleObject.synonims.push(keys[key]);
    qnaSingleObject.longText = qnaDict[keys[key]];

    qnaArray.push(qnaSingleObject);
}

// format JSON pretty print
var JSONString = JSON.stringify(qnaArray, null, 4);

var outputFilename = './qnadict.json';

fs.writeFile(outputFilename, JSONString, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
});

var fromJSONtoObj =  JSON.parse(JSON.stringify(qnaArray));

