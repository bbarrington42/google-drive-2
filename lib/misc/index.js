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


// Normalize date representations
// First iteration will produce the following format mm/dd/yyyy
// Assumes passed date string has slashes
const normalizeDate = dateStr => {
    const arr = dateStr.split ('/');
    const mm = padLeft ('0') (2) (arr[0]);
    const dd = padLeft ('0') (2) (arr[1]);
    const yyyy = arr[2].length === 2 ? S.concat ('20') (arr[2]) : arr[2];
    return S.joinWith ('/') ([mm, dd, yyyy]);
};

// Normalize the dollar amount charges
// All trailing zeros are dropped and a minus sign is prepended
// This is to match the format found in the CSV statement file
const normalizeAmount = amountStr => {
    const re = /[^\d.]/; // Capture only digits and a decimal
    const trimmed = amountStr.replace(re, '');
    return '-' + parseFloat(trimmed).toString();
};

// todo Don't really like having to provide leading empty parens to get the default value
const runFuture = (show = console.log) => future => Future.fork(console.error, res => show(res)) (future);

module.exports = {
    inspect,
    imageHash,
    readFile,
    runFuture,
    normalizeDate,
    normalizeAmount
};
