'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');
const {google} = require ('googleapis');
const keys = require ('../secure/jwt.keys.json');

const client = new google.auth.JWT ({
    email: keys.client_email,
    key: keys.private_key,
    scopes: ['https://www.googleapis.com/auth/drive']
});

const baseRequestOptions = {
    baseUrl: 'https://www.googleapis.com/drive/v3'
};

// todo Document structure of options parameter
const buildRequest = options => url => {
    const requestOptions = {
        url,
        ...baseRequestOptions,
        ...options
    };
    return Future ((reject, resolve) => {
        client.request (requestOptions).then (resolve).catch (reject);
    });
};

module.exports = {
    buildRequest
};
