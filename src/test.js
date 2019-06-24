'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');


const f1 = () => S.map (array =>
    array.length === 1 ? S.map (() => 'Not empty') (S.head (array)) : S.Nothing)
(Future.resolve (['some data']));


const f2 = S.chain (maybe => {
    // The output of this is: maybe?: {"value":"Not empty"}
    // Shouldn't it be: maybe?: Just ("Not empty") ?
    console.log (`maybe?: ${JSON.stringify (maybe)}`);
    return Future.resolve ('dummy');
});

const maybe = f1 ();

// Output of this is: Just ("Not empty")
Future.fork (console.error, console.log) (maybe);


const result = f2 (maybe);

Future.fork (console.error, console.log) (result);
