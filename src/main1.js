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
        return files.length === 1 ? S.map (file => ({
            id: file.id,
            name: file.name
        })) (S.head (files)) : S.Nothing
    }) (api.list_files (options));
};

const getMetaData = maybe => {
  return S.maybe(Future.resolve([]))(({id}) => {
      // Query for all files of type 'image/jpeg' with this id as a parent
      const query = `'${id}' in parents and mimeType = 'image/jpeg'`;
      const options = {params: {q: query}};
      return S.map (res => res.data) (api.list_files (options));
  })(maybe);
};



///////////////////

// Main functions
/////////////////

// Pipeline
///////////

// Testing
const folderId = getFolderId ('Receipts');
const meta = S.chain (getMetaData) (folderId);
Future.fork (console.error, console.log) (meta);
//////////


