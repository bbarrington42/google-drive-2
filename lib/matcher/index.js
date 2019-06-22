'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

// todo Move this function into a library
const readFile = encoding => path => Future ((reject, resolve) => {
    fs.readFile (path, encoding, (err, data) => err ? reject (err) : resolve (data));
});

// Regexes and utilities used to generate summary from master.json file

// At a minimum, we'll need regexes for names, dates, and dollar amounts

const fs = require ('fs');

// Important. These MUST be global!
const dateRegex = /[0-1]\d\/[0-3]\d\/2\d{3}/g;
const dollarAmt = /\$?\s*\d+\.\d{2}/g;

const inputPath = '../../data/master.json';

const input = readFile ('utf8') (inputPath);

const collect = regex => acc => str => {
    const match = regex.exec (str);
    return null === match ? acc : collect (regex) (S.append (match) (acc)) (str);
};

const matcher = regex => S.pipe([
   S.map(collect(regex)([])),
   S.map(S.map(match => match[0]))
]);

const dateMatcher = matcher(dateRegex);
const dollarAmtMatcher = matcher(dollarAmt);

const lines = S.pipe([
    Future.map (data => Object.values (JSON.parse (data))),
    Future.map (S.map (obj => S.joinWith ('') (obj.text)))
]) (input);

const dates = Future.map(dateMatcher)(lines);
const dollarAmts = Future.map(dollarAmtMatcher) (lines);

Future.fork (console.error, console.log) (dates);
Future.fork (console.error, console.log) (dollarAmts);
