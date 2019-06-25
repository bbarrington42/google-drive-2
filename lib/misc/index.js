'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const crypto = require ('crypto');
const Future = require ('fluture');
const fs = require ('fs');


const readFile = encoding => path => Future ((reject, resolve) => {
    fs.readFile (path, encoding, (err, data) => err ? reject (err) : resolve (data));
});

// Accepts an array of text and returns a computed hash
// [text] -> hex
const imageHash = textArray => {
    const hash = crypto.createHash ('sha256');
    // Normalize by sorting
    S.sort (textArray).forEach (text => hash.update (text));
    return hash.digest ('hex');
};

// For inspecting intermediate results in a pipeline
const inspect = (f = a => a) => S.map (a => {
    f (a);
    return a;
});

// Left pad str to width using padChar
const padLeft = padChar => width => str => {
  const chars = [...str];
  const count = S.clamp(0) (width) (width - chars.length);
  return S.concat(padChar.repeat(count)) (str);
};


// todo Don't really like having to provide leading empty parens to get the default value
const runFuture = (show = console.log) => future => Future.fork(console.error, res => show(res)) (future);

module.exports = {
    inspect,
    imageHash,
    readFile,
    runFuture,
    padLeft
};

