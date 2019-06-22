'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

// todo Move this function into a library
const readFile = encoding => path => Future ((reject, resolve) => {
    fs.readFile (path, encoding, (err, data) => err ? reject (err) : resolve (data));
});

// Regexes and utilities used to generate summary from master.json file

// At a minimum, we'll need regexes for names, dates, and dollar amounts

const fs = require ('fs');

const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;

const inputPath = '../../data/master.json';

const input = readFile ('utf8') (inputPath);

const collect = regex => acc => str => {
    const match = regex.exec (str);
    return null === match ? acc : collect (regex) (S.append (match) (acc)) (str);
};


const dates = S.pipe ([
    Future.map (data => Object.values (JSON.parse (data))),
    Future.map (S.map (obj => S.joinWith ('') (obj.text))),
    Future.map (S.map (collect (dateRegex) ([])))
]) (input);


Future.fork (console.error, console.log) (dates);

// const data = [ 'La Tavola104.873.5430992 Virginia Ave NEAtlanta, GA 30306404-873-5430Server: RichardDOB: 06/09/201901:11 PM06/09/2019Table 41/14/40009SALEAm Ex4194317Card #XXXXXXXXXXX2006Magnetic card present : BARRINGTON JOHNCard Entry Method: SApproval: 536714Amount$ 25.59+ GRATUITY:Total :I agree to pay the abovetotal amount according to the',
//     "Mo's PIZZAWelcome to Our Restaurant!6/6/19, 7:13 PM# U49Server: Cashier 001 CDine InSeat 1Credit SaleStatus:ApprovedCard Type:AMEXCard Number:XXXXXXXXXXXX2006Card Owner:BARRINGTON/JOHNSwipe/ManualSwipeAuth Code:561320AMOUNT8.64TIPTOTALSign Xtotalamountagree above to according pay to thethecard issuer agreement." ];
//
// const result = collect(dateRegex)([])(data[0]);
//
// console.log(result);
