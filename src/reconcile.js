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

// Equality for a receipt and a statement entry
// Both object types have the same fields (name, date, & amount)
// However, the receipt values are string arrays whereas the statement values are single strings
const isEqual = statement => receipt => {
    const match = receipt => statement => S.any (S.equals (statement)) (receipt);
    return match (receipt.amount) (statement.amount) ? (match (receipt.date) (statement.date) ?
        S.any (str => statement.name.includes (str)) (receipt.name) : false) : false;
};


const unAccounted = receipts => statement => {
    const reconciled = entry => S.isJust (S.find (isEqual (entry)) (receipts));
    return S.reject (reconciled) (statement);
};


// Download contents of master.json and generate a summary report
const getJson = S.chain (folder =>
    readJson (S.maybe ('') (S.prop ('id')) (folder)) ('application/json') ('master.json'));

const json = getJson (getFolder ('Receipts'));

const receipts = S.map (S.maybe ([]) (summary)) (json);

//runFuture () (receipts);

// todo Get the charges from the statement and reconcile with the receiptsSummary
// todo For now just use this file...
const charges = getCharges ('../data/amex-statement-jun-17.csv');
//runFuture()(charges);

// Reconciliation
// For each receipt, search for a match in the statements array

// testing
const a = [
    {
        name: 'blar',
        date: '06/25/2019',
        amount: '25.25'
    }
];

const b = [
    {
        name: ['blart'],
        date: ['06/25/2019'],
        amount: ['25.25']
    }
];

console.log (unAccounted (b) (a));
