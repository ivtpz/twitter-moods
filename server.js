"use strict"
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

const cityData = require('./data/majorUSCities');
const twitterAuth = require('./config/twitterKey');
const watsonAuth = require('./config/watsonKey');

var tone_analyzer = new ToneAnalyzerV3({
  username: watsonAuth.username,
  password: watsonAuth.password,
  version_date: '2016-05-19'
});

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

const stateTweets = require('./data/stateTweetData.json');
const states = Object.keys(stateTweets);

// states.forEach(state => {
//   const cleanTweets = require('./data/cleanStateTweets.json');
// })

// PROCESSES TWEETS WITH WATSON
// let i = 1;

// function analyzeTweets() {
//   const text = stateTweets[states[i]];
//   tone_analyzer.tone(
//     { text, sentences: false },
//     function(err, tone) {
//       if (err) {
//         console.log(err);
//       } else {
//         const res = JSON.stringify(tone, null, 2)
//         const sentiment = require('./data/stateSentimentData.json');
//         sentiment[states[i]] = tone.document_tone
//         console.log(sentiment)
//         fs.writeFileSync('./data/stateSentimentData.json', JSON.stringify(sentiment));
//         i++;
//         setTimeout(analyzeTweets, 2000);
//       }
//     }
//   );
// }
// analyzeTweets();


// GETS TWEETS FROM MAJOR US CITIES
// const end = ',2mi&lang=en&result_type=popular&count=100';
// function getTweets() {
//   const city = cityData.majorCities[i];
//   i++;
//   const qString =
//     city.latitude.toString() +
//     ',' + city.longitude.toString(); 
//   fetch('http://localhost:5555/api/tweets?geocode=' + qString + end, {
//     method: 'GET'
//   })
//   .then(res => res.json())
//   .then(data => {
//     const text = data.text;
//     if (text.length) {
//       const tweetsByState = require('./data/stateTweetData.json');
//       tweetsByState[city.region] = tweetsByState[city.region] || '';
//       tweetsByState[city.region] += text;
//       fs.writeFileSync('./data/stateTweetData.json', JSON.stringify(tweetsByState))
//     }
//     setTimeout(getTweets, 1000);
//   })
// }
// getTweets()


function handleTweetData (tweets) {
  return tweets.statuses.reduce((text, s) => {
    text += s.truncated ? s.text.slice(0, -3) : s.text;
    return text + ' ';
  }, '');
}


const app = express();

const auth = {
  "token": undefined
}

const watsonURL = "https://gateway.watsonplatform.net/tone-analyzer/api";

app.use('*', function(req, res, next) {
  res.header({
    'Access-Control-Allow-Origin': '*'
  })
  next()
})

// EX: http://localhost:5555/api/tweets?geocode=37.781157,-122.398720,2mi&lang=en&result_type=popular&count=100

app.get('/api/tweets', function(req, res) {
  console.log(req.query)
  let searchString = '';
  for (const key in req.query) {
    searchString += `${key}=${req.query[key]}&`
  }
  searchString = searchString.slice(0, -1);
  const baseUrl = 'https://api.twitter.com'
  const searchUrl = baseUrl + '/1.1/search/tweets.json?q=&' + searchString;
  console.log(searchUrl)
  const searchOptions = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + auth.token
    }
  }
  if (!auth.token) {
    const authString = new Buffer(twitterAuth.key + ':' + twitterAuth.secret).toString('base64');
    const url = baseUrl + '/oauth2/token';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Authorization': 'Basic ' + authString
      },
      body: 'grant_type=client_credentials',
      mode: 'cors'
    }
    fetch(url, options).then(res => res.json())
    .then(json => {
       auth.token = json.access_token;
       return json.access_token;
    })
    .catch(error => console.log(error))
    .then(token => {
      searchOptions.headers= {
        'Authorization': 'Bearer ' + auth.token
      }
      return fetch(searchUrl, searchOptions)
    })
    .then(res => res.json())
    .then(handleTweetData)
    .then(text => 
      res.status(200).send({ text })
    );
  } else {
    fetch(searchUrl, searchOptions)
    .then(res => res.json())
    .then(handleTweetData)
    .then(text =>res.status(200).send({ text }))
  }
});

app.listen(5555)