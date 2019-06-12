'use strict';

const {create, env} = require ('sanctuary');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env
});


// Utility to capture lines of interest
// Capture the first 5 lines of every entry
// Then look for the date and the amount

/*
 Fields to look for:
 Name of payee (normally at top preceding the address)
 account type
 amex, american express (just verify)
 amount, total
 tip (if present, then not usually captured)
 */

// date (formats: MM/DD/YY, YYYY/MM/DD, MM/DD/YYYY, mmm dd, yyyy
const dateRegex = /\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{2}|\d{4}\/\d{2}\/\d{2}|[a-z]{3}\s*\d{1,2},\s*\d{4}/;

const amexRegex = /amex|american\s*express/;

const amtRegex = /\$\s*\d+\s*(\.\d{2})?|amount|total|tip/;

const matcher = regex => line => S.match(regex) (line);

const matchDate = matcher(dateRegex);
const matchAmex = matcher(amexRegex);
const matchAmt = matcher(amtRegex);

module.exports = {
    matchDate,
    matchAmex,
    matchAmt
};
