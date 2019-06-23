'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

const {readFile} = require('../misc');


// Important. These MUST be global since we want ALL matches against a single string
const dateRegex = /[0-1]?\d\/[0-3]?\d\/(20)?\d{2}(?!\d)/g;
const dollarAmt = /\$?\s*\d+\.\d{2}(?!\d)/g;


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
        names: S.fromMaybe ([]) (S.take (3) (strArray)),
        dates: dateMatcher (str),
        amounts: dollarAmtMatcher (str)
    });
};



// Read json from master.json and transform to summary
const summary = json => {
    const lines = getLines (json);
    return S.map(pluck) (lines);
};

const getLines = S.pipe([
    Object.values,
    S.map ((S.prop) ('text'))
]);

// Testing
const fs = require('fs');
const master = JSON.parse(fs.readFileSync('../../data/master.json', 'utf8'));

console.log(summary(master));
///////////////////////
