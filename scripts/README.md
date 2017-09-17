# From 0 to tweet map
  * Run `./doItAll.sh` to run all the scripts
### Get the tweet data
  * Run `./getTweets.js`
  * Tweet data will first be saved to `data/stateTweetData.temp.json`
  * When all tweets are loaded, file is moved to `data/stateTweetData.json`
  * Takes ~20 min
### Analyze moods
  * Note: Theres an API limit of 2500 / month, so this can only be run once per day
  * Run `./getMoodsFromTweets.js`
  * Result is saved to `data/stateSentimentData.temp.json`
  * When complete, results go to `data/stateSentimentData.json`
  * Takes ~5 min
### Make the pictures
  * Run `./makePrettyPictures.js`
  * Reads from `stateSentimentData.json`, and `stateImageSizes.json`
  * Runs python script `states.py` to create images in `../tempImages`
  * Once all the pictures are made, replace the old `../public/images`
  * Takes ~5 min
### Fill in the missing states
  * Run `./fillInMissingStates.js` to put in grey images for all missing states
  * Takes ~10 sec
### Get keywords
  * Run `./getMainWordsFromTweets.js`
  * Saves to `data/stateTweetKeywords.json`
  * Has an `updated` prop on the json object
  * Takes ~10 sec