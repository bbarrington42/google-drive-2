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
        //console.log(`receipt: ${JSON.stringify(receipt)}`);
        const match = receipt => statement => S.any (S.equals (statement)) (receipt);
        // Match only on date and amount
        const rv = match (receipt.amount) (statement.amount) ? match (receipt.date) (statement.date) : false;
        // if(rv) {
        //     console.log(`statement: ${JSON.stringify(statement)}, receipt: ${JSON.stringify(receipt)}`);
        // }
        return rv;
    };

    const [duplicates, singles] = statement;

    const reconciled = entry => S.isJust (S.find (isEqual (entry)) (receipts));
    return S.concat (duplicates) (S.reject (reconciled) (singles));
};

// todo Consider preserving original text from the statement
// Generate report from unaccounted for entries
// Pad line items so that columns are aligned
const buildReport = entries => {
    const toArray = entry => [entry.name, entry.date, entry.amount];
    const arrays = S.map (toArray) (entries);
    // Find the max width of each column
    const fieldWidths = S.reduce (acc => array => S.zipWith (x => y => S.max (x) (y.length)) (acc) (array)) ([0, 0, 0]) (arrays);

    // Right justify each array entry
    const padElems = S.zipWith (width => text => padLeft (width) (text)) (S.map (f => f + 4) (fieldWidths));
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
//runFuture (a => `${a.length} receipts`) (receipts);

// Get the charges from the statement and reconcile with the receipts
// todo For now just use this file...
const charges = getCharges ('../data/amex-statement-jun-17.csv');
//runFuture(a => JSON.stringify(a)) (charges);

// Reconciliation
const unmatched = S.chain (receipt => S.map (charge => unAccountedFor (charge) (receipt)) (charges)) (receipts);
//runFuture (a => `${a.length} not reconciled`) (unmatchedCharges);

const report = S.map (buildReport) (unmatched);
runFuture () (report);

