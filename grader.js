#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

// If the file doesn't exist, exit the program with error code.
// If the file exist, return its name.
var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
	// Exit(0) means successful exit, here is error code 1.
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

// Returns a Cheerio Jquery-style parseable file.
var cheerioHtmlFile = function(htmlfile) {
    //console.log(htmlfile);
    // PAY ATTENTION: fs.readFileSync(htmlfile) returns a buffer in the raw format. Cheerio expects a string 
    // apparently.
    var htmlContent = fs.readFileSync(htmlfile).toString();
    //console.log(htmlContent);
    var toReturn = cheerio.load(htmlContent);
    //console.log(toReturn);
    return toReturn;
};

// Returns an object that has all the values of the checks (input is serialized by JSON).
var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

// Checks if the html file has all the DOM elements included in checksfile.
var checkHtmlFile = function(htmlfile, checksfile) {
    // Cheerio style jQuery in order to access the DOM elements.
    $ = cheerioHtmlFile(htmlfile);
    // Retrieves the checks as a list, sorts it maybe for efficiency????
    var checks = loadChecks(checksfile).sort();
    //console.log(checks);
    // Here we create an object (out).
    // Actually it will be an associative array (kind of HashMap).
    var out = {};
    for(var ii in checks) {
	// $(checks[ii]) returns a list of the DOM elements found with this selector.
	// We check if length > 0 and return a boolean (true / false).
	//console.log(checks[ii]);
        var present = $(checks[ii]).length > 0;
        // checks[ii] have the value "h1" or ".navigation..
	out[checks[ii]] = present;
    }
    // We return an associative array with out["h1"] = true, out[".navigation"] = false etc...
    // console.log(out);
    return out;
};

// Workaround for commander.js issue. Returns a copy of the function (but that will not be bound to the pointer
// of the old function.
var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    // I think bind accepts an argument that will be the new "this" of the object. Therefore we pass it 
    // {} which creates a new object.
    return fn.bind({});
};

// If the program was started from the console (node grader.js "....")
if(require.main == module) {
    // Parsing the parameters.
    // First parametrize using Commander.js
    // Source for option is: function(flags, description, fn, defaultValue)
    // Need to clone because otherwise, when calling again assertFileExists, will still have the old values inside.
    // assertFileExists is for coercion (input error checking).
    // If no argument given, will give index.html.
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
    // Returns an associaive array with out["h1"] = true, out[".navigation"]=false etc...
    var checkJson = checkHtmlFile(program.file, program.checks);
    // We serialize the array to a human-readable string with stringify.
    // JSON.stringify(value[, replacer [, space]]), we print 4 spaces to pretty-print.
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} 
// For if we call the program through an external library and not through the command line.
else {
    exports.checkHtmlFile = checkHtmlFile;
}
