'use strict';

const {create, env} = require ('sanctuary');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env
});

const {normalizeDate, normalizeAmount} = require ('../misc');

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
        name: S.fromMaybe ([]) (S.take (3) (strArray)),
        date: S.map (normalizeDate) (dateMatcher (str)),
        amount: S.map(normalizeAmount) (dollarAmtMatcher (str))
    });
};


const lines = S.pipe ([
    Object.values,
    S.map ((S.prop) ('text')),
    S.map (S.map (S.toLower))
]);

// Read json from master.json and transform to summary
const summary = S.pipe ([
    lines,
    S.map (pluck)
]);

module.exports = {
    summary
};
