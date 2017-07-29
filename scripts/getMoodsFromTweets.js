#! /usr/bin/env node

const fs = require('fs');
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
const watsonAuth = require('../config/watsonKey');
const stateTweets = require('../data/stateTweetData.json');

// const watsonURL = "https://gateway.watsonplatform.net/tone-analyzer/api";

var tone_analyzer = new ToneAnalyzerV3({
  username: watsonAuth.username,
  password: watsonAuth.password,
  version_date: '2016-05-19'
});


const states = Object.keys(stateTweets);

let i = 0;

const continueAnalyzing = () => {
  if (i < states.length) {
    setTimeout(analyzeTweets, 2000);
  } else {
    fs.rename(
      '../data/stateSentimentData.temp.json',
      '../data/stateSentimentData.json',
      (err) => {
        if (err) {
          fs.appendFileSync('../data/log.txt', '\nOMG There was an error saving the Sentiment Analysis. Oh NOES.' + err);
        } else {
          fs.appendFileSync('../data/log.txt', '\nRefreshed US tweet sentiment analysis on ' + new Date())
        }
      }
    )
  }
}

function analyzeTweets() {
  if (i === 0) fs.writeFileSync('../data/stateSentimentData.temp.json', JSON.stringify({}))
  const text = stateTweets[states[i]].replace(/#(.*?)\s/g, '');
  console.log("Analyzing " + states[i]);
  tone_analyzer.tone(
    { text, sentences: false },
    function(err, tone) {
      if (err) {
        fs.appendFileSync('../data/log.txt', 'Watson shit the bed: \n' + err);
      } else {
        const res = JSON.stringify(tone, null, 2)
        const sentiment = require('../data/stateSentimentData.temp.json');
        sentiment[states[i]] = tone.document_tone
        i++;
        fs.writeFileSync('../data/stateSentimentData.temp.json', JSON.stringify(sentiment));
        continueAnalyzing();
      }
    }
  );
}
analyzeTweets();

