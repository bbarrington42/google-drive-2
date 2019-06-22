'use strict';

// Regexes and utilities used to generate summary from master.json file

// At a minimum, we'll need regexes for names, dates, and dollar amounts

const fs = require('fs');

const dateRegex = /\d{2}\/\d{2}\/\d{4}/;

const inputPath = '../../data/master.json';

const input = fs.readFileSync(inputPath, 'utf8');

const values = Object.values(JSON.parse(input));





