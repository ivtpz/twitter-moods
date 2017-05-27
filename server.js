"use strict"
const express = require('express');
const fetch = require('node-fetch');
const twitterAuth = require('./config/twitterKey');
const watsonAuth = require('./config.watsonKey');

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

// EX: http://localhost:5555/api/tweets?query=&geocode0,-0,10km&lang=en&result_type=recent&count=100

app.get('/api/tweets', function(req, res) {
  console.log(req.query)
  let searchString = '';
  for (const key in req.query) {
    searchString += `${key}=${req.query[key]}&`
  }
  searchString = searchString.slice(0, -1);
  const baseUrl = 'https://api.twitter.com'
  const searchUrl = baseUrl + '/1.1/search/tweets.json?q=' + searchString;
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
    .then(json => res.status(200).send(json))
  } else {
    fetch(searchUrl, searchOptions)
    .then(res => res.json())
    .then(json => res.status(200).send(json))
  }
});

app.listen(5555)