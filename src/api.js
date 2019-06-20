'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const client = require ('./drive-client');


const about = client.buildRequest ({
    params: {
        fields: '*'
    }
}) ('/drive/v3/about');


const list_files = (options = {}) => {

    const loop = f => {
        return S.chain (fres => {
            // If 'nextPageToken' is present, then there is more to retrieve
            if (fres.nextPageToken === undefined) {
                return f;
            } else {
                const g = client.buildRequest ({
                    pageToken: fres.nextPageToken,
                    ...options
                }) ('/drive/v3/files');
                return S.map (gres => {
                    gres.files = S.concat (fres.files) (gres.files);
                    return gres;
                }) (g);
            }
        }) (f);
    };

    return loop (client.buildRequest (options) ('/drive/v3/files'));
};


const get_file = options => fileId => client.buildRequest (options) (`/drive/v3/files/${fileId}`);


const delete_file = fileId => client.buildRequest ({
    method: 'DELETE'
}) (`/drive/v3/files/${fileId}`);


const move_file = fromParentId => toParentId => fileId => client.buildRequest ({
    method: 'PATCH',
    params: {
        removeParents: fromParentId,
        addParents: toParentId
    }
}) (`/drive/v3/files/${fileId}`);


// This creates only the metadata for a new file
// Required properties:
// id, mimeType, name, parent folder id
const create_metadata = folderId => mimeType => name =>
    // If for some reason an ID can't be created, then this fails
    Future.chain (maybeId => {
        const rv = S.map (id => {
            const options = {
                method: 'POST',
                kind: 'drive#file',
                data: {
                    id,
                    name,
                    mimeType,
                    parents: [folderId]
                }
            };
            return client.buildRequest (options) ('/drive/v3/files');
        }) (maybeId);
        return S.fromMaybe (Future.resolve (Error (`Could not generate ID for ${name}: ${mimeType}`))) (rv);
    }) (Future.map (res => S.head (res.data.ids)) (ids_for_file));


// Returns a Future of an array of (possibly empty) file IDs
const find_file = mimeType => folderId => name => {
    const query = `name = '${name}' and '${folderId}' in parents and mimeType = '${mimeType}'`;
    const options = {params: {q: query}};
    return S.map (res => S.map (file => file.id) (res.data.files)) (list_files (options));
};


const upload_contents = fileId => data => {
    const options = {
        method: 'PATCH',
        params: {
            uploadType: 'media'
        },
        data
    };
    return client.buildRequest(options) (`/upload/drive/v3/files/${fileId}`);
};


const ids_for_file = client.buildRequest ({
    params: {
        space: 'drive'
    }
}) ('/drive/v3/files/generateIds');


module.exports = {
    list_files,
    get_file,
    move_file
};


// Testing
// 1iRprWI2mA8BvVU8cj3CRybkrmC0vvdQb ('Receipts')
// 1E3CTgo_oIAGM2rFiP-6oki98X9qPpY36  (test.json)
const Future = require ('fluture');
//Future.fork (console.error, res => console.log(res.data.files)) (list_files());
//Future.fork (console.error, console.log) (create_metadata ('1iRprWI2mA8BvVU8cj3CRybkrmC0vvdQb') ('application/json')
// ('test.json'));
Future.fork (console.error, console.log) (find_file ('application/json') ('1iRprWI2mA8BvVU8cj3CRybkrmC0vvdQb') ('test.json'));

//Future.fork (console.error, console.log) (upload_contents('1E3CTgo_oIAGM2rFiP-6oki98X9qPpY36') ('{}'));
