const d3 = require('d3');

const shadesInRange = 10;

const pieceWidth = 15;

const fullHeight = 400;


const scales = [
  {
    anger: [d3.rgb(250, 10, 0), d3.rgb(130, 10, 0)]
  },
  {
    joy: [d3.rgb(255, 255, 0), d3.rgb(255, 186, 20)]
  },
  {
    disgust: [d3.rgb(0, 240, 10), d3.rgb(20, 130, 60)]
  },
  {
    sad: [d3.rgb(0, 150, 255), d3.rgb(0, 10, 255)]
  },
  {
    fear: [d3.rgb(170, 140, 210), d3.rgb(135, 75, 235)]
  }
];

export const colors = scales.map((scale) => { // eslint-disable-line import/prefer-default-export
  const key = Object.keys(scale)[0];
  return {
    [key]: d3.scaleLinear()
             .domain([1, shadesInRange])
             .range(scale[key].reverse())
             .interpolate(d3.interpolateHcl)
  };
});
const range = (end) => {
  let curr = 1;
  const arr = [];
  while (curr <= end) {
    arr.push(curr++);
  }
  return arr;
};
const baseData = range(shadesInRange);

const colorList = scales.map(s => Object.keys(s)[0]);

let data = colorList.map(c => baseData.map(d => [c, d]));

data = data.reduce((a, d) => a.concat(d), []);

d3.select('#mapkey')
  .attr('style', `width: ${pieceWidth}px; position: absolute; left: 80px; top: 130px;`)
  .selectAll('div')
  .data(data)
  .enter()
  .append('div')
  .attr('id', (d, j) => ((j % shadesInRange) === Math.floor((shadesInRange) / 2) ? 'title-anchor' + Math.floor(j / shadesInRange) : 'key' + j))
  .attr('style', (d, j) => {
    const i = Math.floor(j / shadesInRange);
    const b = 'background-color: ' + colors[i][d[0]](d[1]);
    const height = fullHeight / shadesInRange / Object.keys(scales).length;
    const w = `width: ${pieceWidth}px`;
    const h = `height: ${height}px`;
    return [b, w, h].join(';');
  });

