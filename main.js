var d3 = require('d3');

const shadesInRange = 10;

const fullWidth = 600;

const canvasWidth = 600;

const canvasHeight = 400;

d3.select('canvas')
  .attr('style', `width:${canvasWidth}px;height:${canvasHeight}px`)

const scales = [
  {
    anger: [d3.rgb(250, 10, 0), d3.rgb(130, 10, 0)]
  },
  {
    joy: [d3.rgb(255, 255, 0), d3.rgb(255, 186, 20)]
  },
  {
    disgust: [d3.rgb(0,240, 10), d3.rgb(20, 130, 60)]
  },
  {
    sad: [d3.rgb(0, 150, 255), d3.rgb(0, 10, 255)]
  },
  {
    fear: [d3.rgb(170, 140, 210), d3.rgb(135, 75, 235)]
  }
];
export const colors = scales.map(scale => {
  const key = Object.keys(scale)[0];
  return {
    [key]: d3.scaleLinear()
             .domain([1, shadesInRange])
             .range(scale[key])
             .interpolate(d3.interpolateHcl)
  }
})
const range = end => {
  let curr = 1;
  const arr = [];
  while (curr <= end) {
    arr.push(curr++);
  }
  return arr;
} 
const baseData = range(shadesInRange);

const colorList = scales.map(s => Object.keys(s)[0]);

let data = colorList.map(c => baseData.map(d => [c, d]))

data = data.reduce((a, d) => a.concat(d), []);

d3.select('#d3root')
  .attr('style', `width: ${fullWidth}px`)
  .selectAll('div')
  .data(data)
  .enter()
  .append('div')
  .attr('style', (d, j) => {
    const i = Math.floor(j / shadesInRange); 
    const b = 'background-color: ' + colors[i][d[0]](d[1]);
    const size = fullWidth / shadesInRange;
    const w = `width: ${size}px`;
    const h = `height: ${size}px`
    return [b, w, h].join(';')
  });

  // Plan for mood mapping
  // take data for a region, ex:
  const moods = {
    angry: 0.2,
    happy: 0.3,
    pensive: 0.1,
    love: 0.4
  };

