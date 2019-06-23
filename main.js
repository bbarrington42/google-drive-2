'use strict';

// dependencies
const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

const {list_files, getFolder, readBinary, readJson, update_file, move_file} = require ('./src/api');
const {imageHash, inspect} = require ('./lib/misc');

const {extractText} = require ('./lib/extract');


// Helper functions

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
}) (readBinary (meta.id));


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
// 3    Retrieve the file media and extract text
// 4    Update and save the JSON containing the image metadata and extracted text
// 5    Move the images from 'Receipts' to 'Processed Receipts'


const receiptsFolderId = getFolder ('Receipts');
const processedReceiptsFolderId = getFolder ('Processed Receipts');


// Pipeline
const run = S.pipe ([
    S.chain (getMetaData),
    S.chain (meta => Future.map (receipts => ({
        folder: meta.folder,
        receipts
    })) (S.traverse (Future) (getText) (meta.files))),
    S.chain (data => S.map (json => ({
        folder: data.folder,
        json: updateJson (json.value) (data.receipts),
        files: S.map (({id}) => id) (data.receipts)
    })) (readJson (data.folder) ('application/json') ('master.json'))),
    //inspect (a => console.log (`after readJson: ${JSON.stringify (a)}`)),
    S.chain (data => Future.map (() => ({
        folder: data.folder,
        files: data.files
    })) (update_file (data.folder) ('application/json') ('master.json') (data.json))),
    //inspect (a => console.log (`after update_file: ${JSON.stringify (a)}`)),
    S.chain (data => S.chain (moveFiles (data)) (processedReceiptsFolderId))
]) (receiptsFolderId);
///////////

Future.fork (console.error, () => console.log ('Success')) (run);



