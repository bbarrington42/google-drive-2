'use strict';

const {create, env} = require ('sanctuary');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env
});

const {padLeft} = require ('../misc');

// Important. These MUST be global since we want ALL matches against a single string
const dateRegex = /[0-1]?\d\/[0-3]?\d\/(20)?\d{2}(?!\d)/g;
const dollarAmt = /\$?\s*\d+\.\d{2}(?!\d)/g;

// Normalize date representations
// First iteration will produce the following format mm/dd/yyyy
// Assumes passed date string has slashes
const normalizeDate = dateStr => {
    const arr = dateStr.split ('/');
    const mm = padLeft ('0') (2) (arr[0]);
    const dd = padLeft ('0') (2) (arr[1]);
    const yyyy = arr[2].length === 2 ? S.concat ('20') (arr[2]) : arr[2];
    return S.joinWith ('/') ([mm, dd, yyyy]);
};


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
        amount: dollarAmtMatcher (str)
    });
};


const lines = S.pipe ([
    Object.values,
    S.map ((S.prop) ('text'))
]);

// Read json from master.json and transform to summary
// todo Sort dollar amounts descending
const summary = S.pipe ([
    lines,
    S.map (pluck)
]);

module.exports = {
    summary
};
