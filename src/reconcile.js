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
const {runFuture, readFile, padLeft, padRight, padCenter} = require ('../lib/misc');

const Future = require ('fluture');
const EOL = require ('os').EOL;


const unAccountedFor = statement => receipts => {
    // Equality for a receipt and a statement entry
    // Both object types have the same fields (name, date, & amount)
    // However, the receipt values are string arrays whereas the statement values are single strings
    const isEqual = statement => receipt => {
        const match = receipt => statement => S.any (S.equals (statement)) (receipt);
        const rv = match (receipt.amount) (statement.amount) ? (match (receipt.date) (statement.date) ?
            S.any (str => statement.name.includes (str)) (receipt.name) : false) : false;
        console.log(`statement: ${JSON.stringify(statement)}, receipt: ${JSON.stringify(receipt)}, isEqual: ${rv}`);
        return rv;
    };
    const reconciled = entry => S.isJust (S.find (isEqual (entry)) (receipts));
    return S.reject (reconciled) (statement);
};

// todo Consider preserving original text from the statement
// Generate report from unaccounted for entries
// Pad line items so that columns are aligned
const buildReport = entries => {
    const toArray = entry => [entry.name, entry.date, entry.amount];
    const arrays = S.map (toArray) (entries);
    // Find the max widths
    const sorted = S.sortBy (array => S.sum (S.map (e => e.length) (array))) (arrays);
    const fieldWidths = S.fromMaybe ([40, 40, 40]) (S.map (S.map (e => e.length + 4)) (S.last (sorted)));

    // Right justify each array entry
    const padElems = S.zipWith (width => text => padLeft (width) (text)) (fieldWidths);
    const padded = S.map (array => S.joinWith ('') (padElems (array))) (arrays);

    // Finally, each entry occupies one line
    return S.joinWith (EOL) (padded);
};


// Download contents of master.json and generate a summary report
// const getJson = S.chain (folder =>
//     readJson (S.maybe ('') (S.prop ('id')) (folder)) ('application/json') ('master.json'));
//
// const json = getJson (getFolder ('Receipts'));


// todo Get locally just for testing
const json = S.map (str => S.Just (JSON.parse (str))) (readFile ('utf8') ('../data/master.json'));
//runFuture()(json);

const receipts = S.map (S.maybe ([]) (summary)) (json);
//runFuture() (receipts);

// Get the charges from the statement and reconcile with the receipts
// todo For now just use this file...
const charges = getCharges ('../data/amex-statement-jun-17.csv');
//runFuture()(charges);

// Reconciliation
const unmatchedCharges = S.chain (receipt => S.map (charge => unAccountedFor (charge) (receipt)) (charges)) (receipts);

const report = S.map (buildReport) (unmatchedCharges);
runFuture () (report);
