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

// Important. These MUST be global since we want ALL matches against a single string
const dateRegex = /[0-1]\d\/[0-3]\d\/2\d{3}/g;
const dollarAmt = /\$?\s*\d+\.\d{2}(?!\d)/g;

const inputPath = '../../data/master.json';

const input = readFile ('utf8') (inputPath);

const collect = regex => acc => str => {
    const match = regex.exec (str);
    return null === match ? acc : collect (regex) (S.append (match) (acc)) (str);
};


const matcher = regex => str =>
    S.map (match => match[0]) (collect (regex) ([]) (str));


const dateMatcher = matcher (dateRegex);
const dollarAmtMatcher = matcher (dollarAmt);

const pluck = strArray => {
    const str = S.joinWith ('') (strArray);
    return ({
        names: S.take (3) (strArray),
        dates: dateMatcher (str),
        amounts: dollarAmtMatcher (str)
    });
};


const lines = S.pipe ([
    Future.map (data => Object.values (JSON.parse (data))),
    Future.map (S.map (S.prop ('text')))
]) (input);


const matches = S.map (S.map (pluck)) (lines);

Future.fork (console.error, console.log) (matches);

