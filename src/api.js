'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const client = require ('./drive-client');

const Future = require('fluture');


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

// given a folder name, returns a Future Maybe containing an object with the fields: id & name
const getFolder = name => {
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


const get_file = options => fileId => client.buildRequest (options) (`/drive/v3/files/${fileId}`);

const readBinary = fileId => get_file ({
    responseType: 'arraybuffer',  // Important! for handling binary data
    params: {
        alt: 'media'
    }
}) (fileId);

const readJson = folderId => mimeType => name => S.pipe ([
    S.chain (S.traverse (Future) (
        get_file ({
            responseType: 'json',
            params: {
                alt: 'media'
            }
        }))),
    S.map (S.map (res => res.data))
]) (S.map(S.head)(find_file(folderId)(mimeType)(name)));


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
// returns a Future Maybe id
const create_metadata = folderId => mimeType => name => S.pipe ([
    Future.map (res => S.head (res.data.ids)),
    S.chain (S.traverse (Future) (id => {
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
        })
    ),
    Future.map (S.map (res => res.data.id))
]) (ids_for_file);


// Returns a Future of an array of (possibly empty) file IDs
// todo Fix this! mimeType doesn't work!
const find_file = folderId => mimeType => name => {
    const query = `name = '${name}' and '${folderId}' in parents`;// and mimeType = '${mimeType}'`;
    const options = {params: {q: query}};
    return S.map (res => S.map (file => file.id) (res.data.files)) (list_files (options));
};


const upload_contents = data => fileId => {
    const options = {
        method: 'PATCH',
        params: {
            uploadType: 'media'
        },
        data
    };
    return client.buildRequest (options) (`/upload/drive/v3/files/${fileId}`);
};


const find_or_create_metadata = folderId => mimeType => name => {
    // If more than one file is found, the first returned will be used
    const maybeId = S.map (S.head) (find_file (folderId) (mimeType) (name));
    return S.chain (id => S.isNothing (id) ? create_metadata (folderId) (mimeType) (name) : maybeId) (maybeId);
};

const update_file = folderId => mimeType => name => data => S.pipe ([
    S.chain (S.traverse (Future) (upload_contents (data))),
    S.map (S.map (res => res.data.id))
]) (find_or_create_metadata (folderId) (mimeType) (name));


const ids_for_file = client.buildRequest ({
    params: {
        count: 1,
        space: 'drive'
    }
}) ('/drive/v3/files/generateIds');


module.exports = {
    list_files,
    getFolder,
    readJson,
    readBinary,
    move_file,
    update_file,
    upload_contents
};
