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
}) ('/about');


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
                }) ('/files');
                return S.map (gres => {
                    gres.files = S.concat (fres.files) (gres.files);
                    return gres;
                }) (g);
            }
        }) (f);
    };

    return loop (client.buildRequest (options) ('/files'));
};


const get_file = options => fileId => client.buildRequest (options) (`/files/${fileId}`);


const delete_file = fileId => client.buildRequest ({
    method: 'DELETE'
}) (`files/${fileId}`);

/*
 // This works.
 curl --request PATCH \
 'https://www.googleapis.com/drive/v3/files/17w6w07fbXbJ420q_n_mBMfWbzh5B1RU4?addParents=1KhTXPZIomvGXqGEDg4zi_YE4u0w5NRAO&removeParents=1cKhXCpKfoJqyA-l9AuNisLbNaM1svs1t&key=[YOUR_API_KEY]' \
 --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
 --header 'Accept: application/json' \
 --header 'Content-Type: application/json' \
 --data '{}' \
 --compressed

 */
const move_file = fromParentId => toParentId => fileId => client.buildRequest ({
    method: 'PATCH',
    params: {
        removeParents: fromParentId,
        addParents: toParentId
    }
}) (`/files/${fileId}`);

// This creates the metadata for a new file
// Required properties:
// id, mimeType, name, parent folder id
const create_file = folderId => mimeType => name => {
    // If for some reason an ID can't be created, then this fails
    return Future.chain(maybeId => {
        const rv = S.map(id => {
            const options = {
                method: 'POST',
                kind: 'drive#file',
                id,
                name,
                mimeType,
                parents: [folderId]
            };
            return client.buildRequest(options) ('/files');
        }) (maybeId);
        return S.fromMaybe(Future.resolve(Error)) (rv);
    })(Future.map(res => S.head(res.data.ids))(ids_file));

};

const ids_file = client.buildRequest ({
    params: {
        space: 'drive'
    }
}) ('/files/generateIds');


module.exports = {
    list_files,
    get_file,
    move_file
};


// Testing
// 1iRprWI2mA8BvVU8cj3CRybkrmC0vvdQb
const Future = require ('fluture');
//Future.fork (console.error, res => console.log(res.data.files)) (list_files());
Future.fork(console.error, console.log) (create_file('1iRprWI2mA8BvVU8cj3CRybkrmC0vvdQb') ('application/json') ('test.json'));
