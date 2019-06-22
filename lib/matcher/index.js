'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

// todo Move this function into a library
const readFile = encoding => path => Future ((reject, resolve) => {
    fs.readFile (path, encoding, (err, data) => err ? reject (err) : resolve (data));
});

// Regexes and utilities used to generate summary from master.json file

// At a minimum, we'll need regexes for names, dates, and dollar amounts

const fs = require ('fs');

const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;

const inputPath = '../../data/master.json';

const input = readFile ('utf8') (inputPath);

const collect = regex => acc => str => {
    const match = regex.exec (str);
    return null === match ? acc : collect (regex) (S.append (match) (acc)) (str);
};


const dates = S.pipe ([
    Future.map (data => Object.values (JSON.parse (data))),
    Future.map (S.map (obj => S.joinWith ('') (obj.text))),
    Future.map (S.map (collect (dateRegex) ([]))),
    Future.map (S.map (S.map (match => match[0])))
]) (input);


Future.fork (console.error, console.log) (dates);
