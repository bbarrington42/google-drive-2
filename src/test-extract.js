'use strict';

// dependencies
const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');
const crypto = require ('crypto');

const api = require ('./api');
const {writeFile, readFile, inspect} = require ('./misc');

const {extractText} = require ('../lib/extract');


const getFile = id => api.get_file ({
    responseType: 'arraybuffer',  // Important! This allows us to handle the binary data correctly
    params: {
        alt: 'media'
    }
}) (id);

const getTextById = S.pipe ([getFile, S.chain (res => extractText (res.data))]);

const image167 = '1oxT3K6GNaRmkAs6CPntU7mkdLukAWvTm';
const image169 = '1vJx7SjhPfB0M4VNymf_ZLwmEN6wW6Va_';
const image170 = '17w6w07fbXbJ420q_n_mBMfWbzh5B1RU4';
const image171 = '1qEEooUhvpH1DCOTAiek2QoReABiJUeNr';
const image172 = '1v9xpkKaxCaurtbp3M1wRGM6XiR3jjCzZ';
const image173 = '1S6YJELltK0Mb6xvPr4cZAse1g4ICzdv1';

const imageIds = [image167, image169, image171, image172, image173];

// [imageIds] -> [Future<file>] ->

const text = S.pipe ([S.map (getTextById), Future.parallel (6)]) (imageIds);


Future.fork (console.error, console.log) (text);
