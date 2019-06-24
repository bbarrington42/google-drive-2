'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});


const {readFile} = require ('../misc');


const toArrays = S.pipe ([
    S.map (S.lines),
    S.map (S.map (S.splitOn (',')))
]);

// date -> col 0
// amount -> col 2
// name -> col 3

const toObject = array => ({
    name: array[3],
    date: array[0],
    amount: array[2]
});

const toObjects = S.map (S.map (toObject));

const getCharges = csvPath => toObjects (toArrays (readFile ('utf8') (csvPath)));


module.exports = {
    getCharges
};
