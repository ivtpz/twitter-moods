const express = require('express');
const fetch = require('node-fetch');
const morgan = require('morgan');
const path = require('path');

const twitterAuth = require('./config/twitterKey');

function handleTweetData(tweets) {
  return tweets.statuses && tweets.statuses.length
    ? tweets.statuses.reduce((text, s) => {
      text += s.truncated ? s.text.slice(0, -3) : s.text;
      return `${text} `;
    }, '')
    : '';
}

const app = express();

app.use(morgan('dev'));
app.use(express.static(path.resolve(__dirname, 'public')));

const auth = {
  token: undefined
};

app.use('*', (req, res, next) => {
  res.header({
    'Access-Control-Allow-Origin': '*'
  });
  next();
});

app.use('/images', (req, res) => {
  // Couldn't find image, return default image
  console.log('image request');
  res.send(path.resolve(__dirname, 'public/images/grey.jpg'));
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// EX: http://localhost:5555/api/tweets?geocode=37.781157,-122.398720,2mi&lang=en&result_type=popular&count=100

app.get('/api/tweets', (req, res) => {
  let searchString = '';
  Object.keys(req.query).forEach((key) => {
    searchString += `${key}=${req.query[key]}&`;
  });
  searchString = searchString.slice(0, -1);
  const baseUrl = 'https://api.twitter.com';
  const searchUrl = `${baseUrl}/1.1/search/tweets.json?q=&${searchString}`;
  const searchOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  };
  if (!auth.token) {
    const authString = new Buffer(`${twitterAuth.key}:${twitterAuth.secret}`).toString('base64');
    const url = `${baseUrl}/oauth2/token`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        Authorization: `Basic ${authString}`
      },
      body: 'grant_type=client_credentials',
      mode: 'cors'
    };
    fetch(url, options)
      .then(res => res.json()) // eslint-disable-line no-shadow
      .then((json) => {
        auth.token = json.access_token;
        return json.access_token;
      })
      .catch(error => console.log(error))
      .then(() => {
        searchOptions.headers = {
          Authorization: `Bearer ${auth.token}`
        };
        return fetch(searchUrl, searchOptions);
      })
      .then(res => res.json()) // eslint-disable-line no-shadow
      .then(handleTweetData)
      .then(text => res.status(200).send({ text }));
  } else {
    fetch(searchUrl, searchOptions)
      .then(res => res.json()) // eslint-disable-line no-shadow
      .then(handleTweetData)
      .then(text => res.status(200).send({ text }));
  }
});

app.listen(5555, () => console.log('Listening on port 5555'));
