'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

const client = require ('./drive-client');


const about = client.buildRequest ({
    params: {
        fields: '*'
    }
}) ('/about');


const list_drives = client.buildRequest ({}) ('/drives');


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


// Get the ids of the named resources
// Return an object, but if the id does not exist, the value will be null
const get_ids = names => S.map (res => {
    const pairs = S.map (name => {
        const maybeFile = S.find (file => file.name === name) (res.data.files);
        return S.maybe (JSON.parse (`{"${name}": null}`)) (file => JSON.parse (`{"${name}": "${file.id}"}`)) (maybeFile);
    }) (names);

    return S.reduce (acc => obj => ({...acc, ...obj})) ({}) (pairs);

}) (list_files ());


module.exports = {
    list_files,
    get_file,
    delete_file,
    move_file,
    get_ids
};
