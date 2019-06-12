'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');
const fs = require('fs');

const writeFile = buffer => path => Future((reject, resolve) => {
    fs.writeFile(path, buffer, err => err ? reject(err) : resolve(path));
});

const readFile = encoding => path => Future((reject, resolve) => {
   fs.readFile(path, encoding, (err, data) => err ? reject(err) : resolve(data));
});

const inspect = (f = a => a) => S.map(a => {
    f(a);
    return a;
});

module.exports = {
    writeFile,
    readFile,
    inspect
};
