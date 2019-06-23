'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const {readJson, getFolder} = require ('./api');
const {summary} = require ('../lib/summary');

const Future = require ('fluture');

// Download contents of master.json and generate a summary report

const getJson = S.chain (folder => readJson (folder.value.id) ('application/json') ('master.json'));


const json = getJson (getFolder ('Receipts'));

const result = S.map (S.maybe ([]) (summary)) (json);

Future.fork (console.error, console.log) (result);
