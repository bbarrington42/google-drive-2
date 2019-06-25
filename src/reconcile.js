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


// Download contents of master.json and generate a summary report
const getJson = S.chain (folder =>
    readJson (S.maybe ('') (S.prop('id')) (folder)) ('application/json') ('master.json'));

const json = getJson (getFolder ('Receipts'));

const receipts = S.map (S.maybe ([]) (summary)) (json);

// todo Get the charges from the statement and reconcile with the receiptsSummary
// todo For now just use this file...
const charges = getCharges('../data/amex-statement-jun-17.csv');

// todo Reconcile receipts against charges
