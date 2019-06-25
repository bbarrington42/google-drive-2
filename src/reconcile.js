'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const {readJson, getFolder} = require ('./api');
const {summary} = require ('../lib/summary');
const {runFuture} = require ('../lib/misc');

const Future = require ('fluture');


// Download contents of master.json and generate a summary report
const getJson = S.chain (folder =>
    readJson (S.maybe ('') (S.prop('id')) (folder)) ('application/json') ('master.json'));

const json = getJson (getFolder ('Receipts'));

const receiptsSummary = S.map (S.maybe ([]) (summary)) (json);

runFuture()(receiptsSummary);

// todo Get the charges from the statement and reconcile with the receiptsSummary
