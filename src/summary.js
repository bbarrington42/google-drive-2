'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const {readJson, getFolder} = require ('./api');
const {inspect} = require('../lib/misc');

const Future = require ('fluture');

// Download contents of master.json and generate a summary report

const getJson = future => {
    return S.chain (folder => {
        // console.log(`folder: ${JSON.stringify(folder)}`);
        // const folderId = S.map(obj => obj.id)(S.fromMaybe({}) (folder.value));
        // console.log(`folderId: ${JSON.stringify(folderId)}`);
        return readJson(folder.value.id)('application/json')('master.json');
    }) (future);
};


const folder = getFolder('Receipts');

//Future.fork(console.error, console.log) (folder);

const result = getJson (folder);

Future.fork(console.error, console.log) (result);
