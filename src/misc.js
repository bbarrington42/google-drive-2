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


// Accepts an array of text and returns a computed hash
// [text] -> hex
const imageHash = textArray => {
    const hash = crypto.createHash ('sha256');
    // Normalize by sorting
    S.sort(textArray).forEach (text => hash.update (text));
    return hash.digest ('hex');
};

// For inspecting intermediate results in a pipeline
const inspect = (f = a => a) => S.map(a => {
    f(a);
    return a;
});

module.exports = {
    inspect,
    imageHash
};
