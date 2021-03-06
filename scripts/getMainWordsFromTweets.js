#! /usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const stateTweetText = require('../data/stateTweetData.json');
const ignoredWords = require('../data/ignoredWords.json');

const keyWords = {};

Object.keys(stateTweetText).forEach((state) => {
  const text = stateTweetText[state].replace(/[^a-zA-Z#@\s]/g, '');
  const topWords = rankWords(text);
  keyWords[state] = topWords.slice(0, 5);
});
keyWords.updated = new Date();
const fn = '../data/stateTweetKeywords.json';
console.log(keyWords);
fs.writeFileSync(fn, JSON.stringify(keyWords));
console.log('Wrote the file! ', fn);
execSync('cp ../data/stateTweetKeywords.json ../public/');
execSync('curl -X POST -H "Content-Type: application/json" -d \'{"filePath":"data/stateTweetKeywords.json"}\' http://localhost:5555/api/images');

function rankWords(text) {
  const count = {};
  text.split(' ').forEach((word) => {
    if (!ignoredWords[word.toLowerCase()]) {
      const w = word.replace(/'(.*)/g, '');
      count[w] = count[w] || 0;
      count[w]++;
    }
  });
  return Object.keys(count)
    .sort((a, b) => count[b] - count[a])
    .filter(word => word.length > 1 && count[word] > 1);
}
