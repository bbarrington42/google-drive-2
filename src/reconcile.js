'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const {readJson, getFolder} = require ('./api');
const {summary} = require ('../lib/summary');
const {getCharges} = require ('../lib/statement');
const {runFuture} = require ('../lib/misc');

const Future = require ('fluture');
const EOL = require('os').EOL;


const unAccountedFor = statement => receipts => {
    // Equality for a receipt and a statement entry
    // Both object types have the same fields (name, date, & amount)
    // However, the receipt values are string arrays whereas the statement values are single strings
    const isEqual = statement => receipt => {
        const match = receipt => statement => S.any (S.equals (statement)) (receipt);
        return match (receipt.amount) (statement.amount) ? (match (receipt.date) (statement.date) ?
            S.any (str => statement.name.includes (str)) (receipt.name) : false) : false;
    };
    const reconciled = entry => S.isJust (S.find (isEqual (entry)) (receipts));
    return S.reject (reconciled) (statement);
};

// Generate report from unaccounted for entries
// todo Consider preserving original text from the statement
// todo Also, pad line items so that columns are aligned
const buildReport = entries => {
  const buildLine = entry => S.joinWith(' '.repeat(4)) ([entry.name, entry.date, entry.amount]);
  return S.joinWith(EOL)(S.map(buildLine) (entries));
};


// Download contents of master.json and generate a summary report
const getJson = S.chain (folder =>
    readJson (S.maybe ('') (S.prop ('id')) (folder)) ('application/json') ('master.json'));

const json = getJson (getFolder ('Receipts'));

const receipts = S.map (S.maybe ([]) (summary)) (json);
//runFuture() (receipts);

// Get the charges from the statement and reconcile with the receipts
// todo For now just use this file...
const charges = getCharges ('../data/amex-statement-jun-17.csv');
//runFuture()(charges);

// Reconciliation
const unmatchedCharges = S.chain(receipt => S.map(charge => unAccountedFor(charge) (receipt)) (charges)) (receipts);

const report = S.map(buildReport) (unmatchedCharges);
runFuture() (report);
