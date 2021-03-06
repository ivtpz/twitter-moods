#! /usr/bin/env node

const PythonShell = require('python-shell');
const fs = require('fs');
const sentimentData = require('../data/stateSentimentData.json');
const imageSizes = require('../data/stateImageSizes.json');
const { spawnSync, execSync } = require('child_process');

const uploadServer = 'http://localhost:5555';
const uploadEndpoint = `${uploadServer}/api/images`;

const states = Object.keys(sentimentData);
let i = 0;

if (!fs.existsSync('../tempImages')) {
  fs.mkdirSync('../tempImages');
}

const keepItGoing = () => {
  if (i < states.length) {
    runProg();
  } else {
    const date = new Date();
    const dateString = date.toDateString();
    fs.appendFileSync('../data/log.txt', `Made all the pretty pictures on ${dateString}`);
    fs.writeFileSync('../tempImages/updated.json', { updated: dateString });
    spawnSync('rm', ['-rf', '../public/images']);
    fs.mkdirSync('../public/images');
    execSync('mv ../tempImages/* ../public/images/');
    // Upload to AWS S3
    states.forEach((state) => {
      const filePath = `public/images/${state}.jpg`;
      if (fs.existsSync(`../${filePath}`)) {
        console.log(`requesting to upload ${filePath}`);
        execSync(`curl -X POST -H "Content-Type: application/json" -d '{"filePath":"${filePath}"}' ${uploadEndpoint}`);
      }
    });
    console.log('All done.');
  }
};

const runProg = () => {
  const watsonData = sentimentData[states[i]].tone_categories[0].tones;

  const data = watsonData.reduce((obj, next) => {
    obj[next.tone_id.slice(0, 1)] = next.score;
    return obj;
  }, {});

  if (data.j && imageSizes[states[i]]) {
    const pictureData = {
      size: imageSizes[states[i]],
      name: states[i],
      data
    };
    const options = {
      mode: 'json',
      pythonPath: '/usr/local/bin/python3',
      scriptPath: './',
      args: JSON.stringify(pictureData)
    };

    console.log(`Making image for ${states[i]}`);

    PythonShell.run('states.py', options, (err, res) => {
      console.log('err: ', err);
      console.log('res: ', res);
      i++;
      keepItGoing();
    });
  } else {
    i++;
    keepItGoing();
  }
};
runProg();

// const d = {
//   size: [75, 122],
//   data: {
//     a: 0.105095,
//     d: 0.410249,
//     f: 0.521788,
//     j: 0.578097,
//     s: 0.495613
//   }
// };
