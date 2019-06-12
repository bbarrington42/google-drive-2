'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Rekognition = require ('aws-sdk/clients/rekognition');
const rekognition = new Rekognition ({
    region: 'us-east-1'
});

const Future = require ('fluture');
const EOL = require ('os').EOL;

const matcher = require ('./matcher');


const toText = detections => {
    const type = S.prop ('Type');
    const text = S.prop ('DetectedText');
    const isLine = S.pipe ([type, S.equals ('LINE')]);

    const result = S.pipe ([
        S.filter (isLine),
        S.map (S.pipe ([text, S.toLower]))
    ]) (detections);

    return result;
};


const linesOfInterest = text => {
    const anyMatcher = matchers => line => S.any (m => S.isJust (m (line))) (matchers);

    // We've captured all detected text lines and lowercased all lines
    // Grab the first 5 lines, and then look for any of the following in the remaining ones: dates and dollar amounts
    const firstFive = S.pipe ([S.take (5), S.fromMaybe ([])]) (text);

    // Everything after the first 5
    const rest = S.pipe ([S.drop (5), S.fromMaybe ([])]) (text);

    // Look for dates, dollar amounts, or amex
    const filteredRest = S.filter (anyMatcher ([matcher.matchDate, matcher.matchAmt, matcher.matchAmex])) (rest);

    // Concatenate
    return S.concat (firstFive) (filteredRest);
};


const interpretResult = ({TextDetections: detections}) => linesOfInterest (toText (detections));



const detectText = buffer => Future ((reject, resolve) => {
    const params = {
        Image: {
            Bytes: buffer
        }
    };

    rekognition.detectText (params, (err, data) =>
        err ? reject (err) : resolve (interpretResult (data)));
});

module.exports = {
    detectText
};


