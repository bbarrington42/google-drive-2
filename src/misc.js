'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const crypto = require ('crypto');
const Future = require ('fluture');
const fs = require('fs');

const writeFile = buffer => path => Future((reject, resolve) => {
    fs.writeFile(path, buffer, err => err ? reject(`writeFile: ${err}`) : resolve(path));
});

const readFile = encoding => path => Future((reject, resolve) => {
   fs.readFile(path, encoding, (err, data) => err ? reject(`readFile: ${err}`) : resolve(data));
});

// Accepts an array of text and returns a computed hash
// [text] -> hex
const imageHash = textArray => {
    const hash = crypto.createHash ('sha256');
    textArray.forEach (text => hash.update (text));
    return hash.digest ('hex');
};

const inspect = (f = a => a) => S.map(a => {
    f(a);
    return a;
});

module.exports = {
    writeFile,
    readFile,
    inspect,
    imageHash
};
