'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Textract = require ('aws-sdk/clients/textract');
const textract = new Textract ({
    region: 'us-east-1'
});

const Future = require ('fluture');


const detectText = buffer => Future ((reject, resolve) => {

    textract.detectDocumentText ({
        Document: {
            Bytes: buffer
        }
    }, (err, res) =>
        err ? reject (err) : resolve (res));
});

const getLines = ({Blocks}) =>
    S.reduce (acc => block => block.BlockType === 'LINE' ? S.append (block.Text) (acc) : acc) ([]) (Blocks);


const extractText = buffer => Future.map (getLines) (detectText (buffer));

module.exports = {
    extractText
};
