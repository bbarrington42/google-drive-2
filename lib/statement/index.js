'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});


const {readFile, duplicates, unique, timerStart, timerEnd, timerLog, inspect} = require ('../misc');

const toArrays = S.pipe ([
    S.map (S.lines),
    S.map (S.reject (line => line.length === 0)),  // Reject any empty lines
    S.map (S.map (str => str.replace (/\s+/g, ''))),
    //inspect(console.log),
    S.map (S.map (S.splitOn (',')))
]);

// date -> col 0
// amount -> col 2
// name -> col 3

const toObject = array => ({
    name: array[3].toLowerCase (),
    date: array[0],
    amount: array[2]
});

const toObjects = S.map (S.map (toObject));

const entryEquality = l => r => {
    const ldate = new Date (l.date).getTime ();
    const rdate = new Date (r.date).getTime ();
    return ldate === rdate && l.amount === r.amount;
};

const partitioned = S.map (entries => [duplicates (entries) (entryEquality), unique (entries) (entryEquality)]);


const getCharges = csvPath => S.pipe ([
    timerStart ('statement'),
    toArrays,
    timerLog ('arrays done') ('statement'),
    toObjects,
    timerLog ('objects done') ('statement'),
    partitioned,
    timerEnd ('statement')
]) (readFile ('utf8') (csvPath));

module.exports = {
    getCharges
};
