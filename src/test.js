'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');



// given a folder name, returns a Future Maybe containing an object with the fields: id & name
const getFolder = () => {
    return Future.map (res => {
        const files = res.data.files;
        // Success only if there is one resource
        return files.length === 1 ? S.map (file => ({
            id: file.id,
            name: file.name
        })) (S.head (files)) : S.Nothing;
    }) (Future.resolve({data: {files: [{id: 'thisisanid', name: 'thisisaname'}]} }));
};

const getJson = S.chain (folder => {
    console.log (`folder: ${JSON.stringify (folder)}`);
    return Future.resolve('blart');
});

const folder = getFolder();

Future.fork(console.error, console.log) (folder);

const result = getJson(folder);


Future.fork(console.error, console.log) (result);
