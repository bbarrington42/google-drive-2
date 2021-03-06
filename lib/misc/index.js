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


// Normalize date representations
// First iteration will produce the following format mm/dd/yyyy
// Assumes passed date string has slashes or hyphens as separators
const normalizeDate = dateStr => {
    const arr = dateStr.split (/[/\-]/);
    const mm = arr[0].padStart (2, '0');
    const dd = arr[1].padStart (2, '0');
    const yyyy = arr[2].length === 2 ? S.concat ('20') (arr[2]) : arr[2];
    return S.joinWith ('/') ([mm, dd, yyyy]);
};

// Normalize the dollar amount charges
// All trailing zeros are dropped and a minus sign is prepended
// This is to match the format found in the CSV statement file
const normalizeAmount = amountStr => {
    const re = /[^\d.]/; // Capture only digits and a decimal
    const trimmed = amountStr.replace (re, '');
    return '-' + parseFloat (trimmed).toString ();
};

// padding
const pad = padFunc => width => text => {
    const loop = count => result => count <= 0 ? S.joinWith ('') (result) : loop (count - 1) (padFunc (result));

    const chars = Array.from (text);
    return loop (width - chars.length) (chars);
};

// Right justify
const padLeft = pad (S.prepend (' '));

// Left justify
const padRight = pad (S.append (' '));

// Prefer right justification
const padCenter = width => text => {
    const len = Array.from (text).length;
    const right = (width + len) / 2;
    return padLeft (width) (padRight (right) (text));
};


// Get all duplicates in an array using the supplied (curried) equality function
const duplicates = input => equal => {
    const loop = input => acc => {
        const dups = (head, tail) => {
            const filtered = S.filter (equal (head)) (tail);
            return filtered.length > 0 ? loop (S.reject (equal (head)) (tail)) (S.prepend (head) (S.concat (acc) (filtered))) : loop (tail) (acc);
        };
        const [head, ...tail] = input;
        return head ? dups (head, tail) : acc;
    };

    return loop (input) ([]);
};

// Get all unique values in an array using the supplied (curried) equality function.
// Note that if the collection has any duplicates, then none of those values will be returned.
const unique = input => equal => {
    const loop = input => acc => {
        const uniq = (head, tail) => {
            const filtered = S.filter (equal (head)) (tail);
            return filtered.length === 0 ? loop (tail) (S.append (head) (acc)) : loop (S.reject (equal (head)) (tail)) (acc);
        };

        const [head, ...tail] = input;
        return head ? uniq (head, tail) : acc;
    };

    return loop (input) ([]);
};


// Take an existing Future and cause it to delay execution for 'delay' milliseconds
const pause = delay => future => Future.go (function* () {
    return yield Future.chain (() => future) (Future.after (delay, null));
});

// todo Don't really like having to provide leading empty parens to get the default value
const runFuture = (show = a => a) => future => Future.fork (console.error, res => console.log (show (res))) (future);

module.exports = {
    inspect,
    imageHash,
    readFile,
    runFuture,
    normalizeDate,
    normalizeAmount,
    pause,
    padLeft,
    duplicates,
    unique
};
