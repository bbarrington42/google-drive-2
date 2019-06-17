// Steps
// 1    Get the ids of the folders: 'Receipts' & 'Processed Receipts'
// 2    Get the metadata of the files in the folder 'Receipts'
// 3    Retrieve the file media and extract text in parallel
// 4    Update and save the JSON containing the image metadata and extracted text
// 5    Move the images from 'Receipts' to 'Processed Receipts'

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


// Helper functions

// given a folder name, returns a Future Maybe containing an object with the fields: id & name
const getFolderId = name => {
    const query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder'`;
    const options = {params: {q: query}};
    return S.map (res => {
        const files = res.data.files;
        // Success only if there is one resource
        return files.length === 1 ? S.map (file => ({
            id: file.id,
            name: file.name
        })) (S.head (files)) : S.Nothing
    }) (api.list_files (options));
};

// given a Maybe {id:, name:} (parent folder), return a Future [file-resource] (children)
const getMetaData = S.maybe (Future.resolve ([])) (({id}) => {
    // Query for all files of type 'image/jpeg' with this id as a parent
    const query = `'${id}' in parents and mimeType = 'image/jpeg'`;
    const options = {params: {q: query}};
    return S.map (res => res.data.files) (api.list_files (options));
});

// given a file metadata object ({kind:, id:, name:, mimeType:}), return a Future of the extracted-text
const getText = meta => {
    return Future.map (res => Buffer.from(res.data)) (api.get_file ({
        responseType: 'arraybuffer',  // Important! This allows us to handle the binary data correctly
        params: {
            alt: 'media'
        }
    }) (meta.id))
};


///////////////////

// Main functions
/////////////////

// Pipeline
///////////

// Testing
const folderId = getFolderId ('Receipts');
const meta = S.chain (getMetaData) (folderId);
const buffers = S.chain(arr => Future.parallel(5) (S.map(getText) (arr))) (meta);
Future.fork (console.error, console.log) (buffers);
//////////


