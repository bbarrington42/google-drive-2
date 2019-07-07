'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});


const {readFile, inspect} = require ('../misc');

// todo Fix this so that a trailing empty line in CSV input does not cause exception
const toArrays = S.pipe ([
    S.map (S.lines),
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


const getCharges = csvPath => {
    const grouped = S.map (objects => S.groupBy (l => r => {
        const ldate = new Date (l.date).getTime ();
        const rdate = new Date (r.date).getTime ();
        return ldate === rdate && l.amount === r.amount;
    }) (objects)) (toObjects (toArrays (readFile ('utf8') (csvPath))));

    // Partition off any duplicates
    return S.map (outer => {
        console.log(`outer: ${JSON.stringify(outer)}`);
        const duplicates = S.join (S.filter (inner => inner.length > 1) (outer));
        //console.log (`duplicates: ${JSON.stringify(duplicates)}`);
        const singles = S.join (S.reject (inner => inner.length > 1) (outer));
        return S.Pair (duplicates) (singles);
    }) (grouped);
};


module.exports = {
    getCharges
};
