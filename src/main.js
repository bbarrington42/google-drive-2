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

const {detectText} = require ('../lib/detect_text');


/// helper functions ///////////////////

// Retrieve file contents as a Buffer.
// In addition to the Buffer, the file name and the id are returned
const contents = file =>
    S.map (res => ({id: file.id, name: file.name, content: Buffer.from (res.data)})) (api.get_file ({
        responseType: 'arraybuffer',  // Important! This allows us to handle the binary data correctly
        params: {
            alt: 'media'
        }
    }) (file.id));


const extract_text = obj => S.map (text => ({
    id: obj.id,
    name: obj.name,
    hash: imageHash (text),
    text
})) (detectText (obj.content));


// helper to write each image to local storage and return file id, name, hash, and captured text
const process_file = obj => {
    const f = writeFile (obj.content) (`../data/${obj.name}`);
    return S.chain (extract_text) (S.map (() => obj) (f));
};


const update_receipts = receipts => json => {
    const update_receipt = json => receipt => {
        json[receipt.hash] = {id: receipt.id, name: receipt.name, text: receipt.text};
        return json;
    };

    return S.reduce (update_receipt) (json) (receipts);
};


// Accepts an array of text and returns a computed hash
const imageHash = textArray => {
    const hash = crypto.createHash ('sha256');
    textArray.forEach (text => hash.update (text));
    return hash.digest ('hex');
};


/// Top level functions follow //////////////////////

// read in the receipts.json file.
// create the file if it doesn't exist.
const json =
    S.map (JSON.parse) (Future.fold (() => '{}') (a => a)
    (readFile ('utf8') ('../data/receipts.json')));

const folderIds = api.get_ids (['Receipts', 'Processed Receipts']);

// Get the id of the named folder
const folderId = name => S.map (obj => {
    const folderId = obj[name];
    return null === folderId ? S.Nothing : S.Just (folderId);
}) (folderIds);

const receiptsFolderId = folderId ('Receipts');

// Retrieve all files of mimeType 'image/jpeg' underneath that folder
const find_images = S.chain (maybeId => {
    return S.maybe (Future.resolve ([])) (id => {
        // Query for all files of type 'image/jpeg' with this id as a parent
        const query = `'${id}' in parents and mimeType = 'image/jpeg'`;
        const options = {params: {q: query}};
        return S.map (res => res.data) (api.list_files (options));
    }) (maybeId);
});


// Download the image contents
const download_contents = S.pipe ([
    // get the array of files
    S.map (filelist => filelist.files),
    // transform to array of objects containing the name, hash and content
    S.chain (S.traverse (Future) (contents))
]);


// this saves the image to local storage and returns the name, hash, and extracted text
const process_files = S.chain (S.traverse (Future) (process_file));

const update_json = S.chain (receipts => S.map (update_receipts (receipts)) (json));

// return the JSON so we can extract the file ids in the next step
const save_json = S.chain (json => S.map (() => json) (writeFile (Buffer.from (JSON.stringify (json))) ('../data/receipts.json')));


// Extract the file ids from the saved json and move identified files into the folder 'Processed Receipts'
const processedReceiptsFolderId = folderId ('Processed Receipts');

// load up a function in a Future
const move_image = S.chain (from => S.map (to => api.move_file (S.maybeToNullable(from)) (S.maybeToNullable(to))) (processedReceiptsFolderId)) (receiptsFolderId);


const move_images = S.chain (obj => {
    const ids = S.map (key => obj[key].id) (Object.keys (obj));
    return S.traverse (Future) (id => S.chain(move => move(id))(move_image)) (ids);
});

////////////////
const run = S.pipe ([
    find_images,
    inspect (),
    download_contents,
    inspect (),
    process_files,
    inspect (),
    update_json,
    inspect (),
    save_json,
    inspect (),
    move_images
]) (receiptsFolderId);


run.fork (console.error, res => console.log(JSON.stringify(res)));
