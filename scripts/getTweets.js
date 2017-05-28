const fs = require('fs');
const fetch = require('node-fetch');
const cityData = require('../data/majorUSCities');

const removeLinks = text => {
  const re = /\shttps?:\/\/(?:[^\s]+)/gi;
  return text.replace(re, '');
}

const removeSpecialChars = text => {
  const re = /[^[^\x00-\x7F]/gi
  asciiText = text.replace(re, '');
  return asciiText.replace(/[\\n]/gi, ' ');
};

const cleanUpTweetText = text => {
  const noLinks = removeLinks(text);
  return removeSpecialChars(noLinks);
};

let i = 0;
const end = ',2mi&lang=en&result_type=popular&count=100';
function getTweets() {
  if (!i) fs.writeFileSync('../data/stateTweetData.temp.json', JSON.stringify({}))
  const city = cityData.majorCities[i];
  i++;
  const qString =
    city.latitude.toString() +
    ',' + city.longitude.toString(); 
  fetch('http://localhost:5555/api/tweets?geocode=' + qString + end, {
    method: 'GET'
  })
  .then(res => res.json())
  .then(data => {
    const { text } = data;
    if (text.length) {
      const tweetsByState = require('../data/stateTweetData.temp.json');
      const stateCode = cityData.stateValues[city.state];
      tweetsByState[stateCode] = tweetsByState[stateCode] || '';
      tweetsByState[stateCode] += cleanUpTweetText(text);
      fs.writeFileSync('../data/stateTweetData.temp.json', JSON.stringify(tweetsByState))
    }
    if (i < cityData.majorCities.length) {
      setTimeout(getTweets, 1000);
    } else {
      fs.rename(
        '../data/stateTweetData.temp.json',
        '../data/stateTweetData.json',
        (err) => {
          if (err) {
            fs.appendFile('../data/log.txt', 'OMG There was an error saving the tweets. Oh NOES. \n' + err);
          } else {
            fs.appendFile('../data/log.txt', 'Made a new US state tweet data file on ' + new Date());
          }
        }
      );
    }
  })
}

// Make it happen, captin.
getTweets()
