#! /usr/bin/env node

const fs = require('fs');
const fetch = require('node-fetch');
const cityData = require('../data/majorUSCities');

const removeLinks = (text) => {
  const re = /\shttps?:\/\/(?:[^\s]+)/gi;
  return text.replace(re, '');
};

const removeSpecialChars = (text) => {
  const re = /[^[^\x00-\x7F]/gi;
  asciiText = text.replace(re, '');
  return asciiText.replace(/\n/g, ' ');
};

const cleanUpTweetText = (text) => {
  const noLinks = removeLinks(text);
  return removeSpecialChars(noLinks);
};

let i = 0;
// while (cityData.majorCities[i].city !== 'Pleasanton') {
//   i++;
// };
// console.log(i)
const end = ',2mi&lang=en&result_type=popular&count=100';
function getTweets() {
  if (!i) fs.writeFileSync('../data/stateTweetData.temp.json', JSON.stringify({}));
  const city = cityData.majorCities[i];
  i++;
  const qString = `${city.latitude.toString()},${city.longitude.toString()}`;
  console.log('searching around ', city.city);
  fetch(`http://localhost:5555/api/tweets?geocode=${qString}${end}`, {
    method: 'GET'
  })
    .then(res => res.json())
    .then((data) => {
      const { text } = data;
      if (text.length) {
        const tweetsByState = require('../data/stateTweetData.temp.json');
        const stateCode = cityData.stateValues[city.state.toUpperCase()];
        tweetsByState[stateCode] = tweetsByState[stateCode] || '';
        tweetsByState[stateCode] += cleanUpTweetText(text);
        fs.writeFileSync('../data/stateTweetData.temp.json', JSON.stringify(tweetsByState));
      }
      if (i < cityData.majorCities.length) {
        setTimeout(getTweets, 1000);
      } else {
        let recieveFileName = false;
        let newFileName = '../data/stateTweetData.json';
        showPrompt(newFileName);
        setTimeout(() => console.log('\n30s gone...'), 30000);
        setTimeout(() => console.log('\nOne minute left...'), 60000);
        setTimeout(() => console.log('\n30s left...'), 90000);
        setTimeout(() => {
          console.log("OK, I'm doing it for you.");
          renameFile(newFileName);
        }, 120000);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (text) => {
          if (!recieveFileName) {
            text = text.slice(0, 1).toLowerCase();
            if (text === 'y') {
              renameFile(newFileName);
            } else if (text === 'n') {
              recieveFileName = true;
              process.stdout.write('File name?: ');
            }
          } else {
            newFileName = text.slice(0, -1);
            recieveFileName = false;
            showPrompt(newFileName);
          }
        });
      }
    });
}

// Make it happen, captin.
getTweets();

function showPrompt(fileName) {
  console.log('This program will self destruct in T - 2 minutes!');
  process.stdout.write(`Do you want to save the tweets to ${fileName}? [y/n] `);
}

function done() {
  console.log('Byeeeeee!');
  process.exit();
}

function renameFile(name) {
  fs.rename('../data/stateTweetData.temp.json', name, (err) => {
    if (err) {
      fs.appendFileSync(
        '../data/log.txt',
        `\nOMG There was an error saving the tweets. Oh NOES. \n${err}`
      );
    } else {
      fs.appendFileSync(
        '../data/log.txt',
        `\nMade a new US state tweet data file on ${new Date()}`
      );
    }
    console.log('All done.');
    done();
  });
}
