#! /bin/bash

# cp ../data/stateTweetKeywords.json ../public/src/visualizations/twitter-moods
curl -X POST -H "Content-Type: application/json" -d '{"filePath":"data/stateTweetKeywords.json"}' http://localhost:5555/api/images