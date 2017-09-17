#! /usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const { stateValues } = require('../data/majorUSCities.js');

const states = Object.keys(stateValues).reduce((array, key) => {
  if (array.indexOf(stateValues[key]) === -1) {
    array.push(stateValues[key]);
  }
  return array;
}, []);

states.forEach((state) => {
  if (!fs.existsSync(`../public/images/${state}.jpg`)) {
    console.log(`Making filler file for ${state}`);
    const r = execSync(`cp ../public/permanentimages/grey.jpg ../public/images/${state}.jpg`);
    console.log(r);
  }
});

console.log('Done.');
process.exit();
