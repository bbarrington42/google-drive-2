'use strict';

// dependencies
const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

const {list_files, get_file, move_file} = require ('./api');
const {imageHash, writeFile, readFile, inspect} = require ('./misc');

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
        })) (S.head (files)) : S.Nothing;
    }) (list_files (options));
};

// given a Maybe {id:, name:} (parent folder), return a Future {folder:, files: [file-metadata]} (the children)
const getMetaData = S.maybe (Future.resolve ([])) (({id}) => {
    // Query for all files of type 'image/jpeg' with this id as a parent
    const query = `'${id}' in parents and mimeType = 'image/jpeg'`;
    const options = {params: {q: query}};
    return S.map (res => ({folder: id, files: res.data.files})) (list_files (options));
});

// given a file metadata object ({kind:, id:, name:, mimeType:}), return a Future of the extracted-text, id, hash, &
// name (as an Object)
const getText = meta => Future.chain (res => {
    return Future.map (text => ({
        id: meta.id,
        name: meta.name,
        hash: imageHash (text),
        text
    })) (extractText (Buffer.from (res.data)));
}) (get_file ({
    responseType: 'arraybuffer',  // Important! This allows us to handle the binary data correctly
    params: {
        alt: 'media'
    }
}) (meta.id));


// given an array of new receipts (each object has id, hash, name, & text array) and the existing json, return the
// updated json [receipt...] -> json -> json
const updateJson = json => receipts => {
    const update_receipt = json => receipt => {
        json[receipt.hash] = {id: receipt.id, name: receipt.name, text: receipt.text};
        return json;
    };

    return S.reduce (update_receipt) (json) (receipts);
};

const moveFiles = source => to =>
    S.traverse (Future) (file => move_file (source.folder) (S.maybeToNullable (to).id) (file)) (source.files);


///////////////////
// Steps
// 1    Get the ids of the folders 'Receipts' & 'Processed Receipts'
// 2    Get the metadata of the files in the folder 'Receipts'
// 3    Retrieve the file media and extract text in parallel
// 4    Update and save the JSON containing the image metadata and extracted text
// 5    Move the images from 'Receipts' to 'Processed Receipts'


const receiptsFolderId = getFolderId ('Receipts');
const processedReceiptsFolderId = getFolderId ('Processed Receipts');

// todo Add file watch and create an event loop

// Pipeline
const run = S.pipe ([
    S.chain (getMetaData),
    S.chain (meta => Future.map (receipts => ({
        folder: meta.folder,
        receipts
    })) (S.traverse (Future) (getText) (meta.files))),
    S.chain (data => S.map (json => ({
        folder: data.folder,
        json: updateJson (JSON.parse (json)) (data.receipts),
        files: S.map (({id}) => id) (data.receipts)
    })) (readFile ('../data/receipts.json'))),
    S.chain (data => Future.map (() => ({
        folder: data.folder,
        files: data.files
    })) (writeFile (Buffer.from (JSON.stringify (data.json))) ('../data/receipts.json'))),
    S.chain (data => S.chain (moveFiles (data)) (processedReceiptsFolderId))
]) (receiptsFolderId);
///////////

// todo Return something more useful
Future.fork (console.error, console.log) (run);


