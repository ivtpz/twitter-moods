#! /usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const { stateValues } = require('../data/majorUSCities.js');

const uploadServer = 'http://localhost:5555';
const uploadEndpoint = `${uploadServer}/api/images`;

const states = Object.keys(stateValues).reduce((array, key) => {
  if (array.indexOf(stateValues[key]) === -1) {
    array.push(stateValues[key]);
  }
  return array;
}, []);

states.forEach((state) => {
  const filePath = `public/images/${state}.jpg`;
  if (!fs.existsSync(`../${filePath}`)) {
    console.log(`Making filler file for ${state}`);
    execSync(`cp ../public/permanentimages/grey.jpg ../public/images/${state}.jpg`);
    execSync(`curl -X POST -H "Content-Type: application/json" -d '{"filePath":"${filePath}"}' ${uploadEndpoint}`);
  }
});

console.log('Done.');
process.exit();
