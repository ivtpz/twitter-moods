#! /usr/bin/env node
const colors = require('colors');

// Get and validate passed in args
const args = process.argv.slice(2)
  .map(a => {
    if (a === 'true') return true;
    if (a === 'false' || !a) return false;
    return a;
  });

if (args.length < 3) {
  args.push(false)
}

const validateArgs = (args) => {
  let valid = true;
  args.slice(0, 2).forEach(arg => {
    if (!arg || typeof arg !== 'string') {
      valid = false
    }
  })
  if (args.length > 2 && typeof args[2] !== 'boolean') {
    valid = false
  }
  return valid;
};

if (!validateArgs(args)) {
  describeExpectedArgs();
  explainRelPaths();
  return;
}

const [sizeFile, mapDFile, update] = args;

// Pull in file data
const fs = require('fs');
const cloneDeep = require('lodash/cloneDeep');
let originalSizes
let sizes;
let mapData;

if (update) {
  try {
    originalSizes = JSON.parse(fs.readFileSync(sizeFile).toString());
    sizes = cloneDeep(originalSizes);
  } catch(err) {
    console.log(err);
    giveBadPathMessage('sizes');
    explainRelPaths();
    return;
  }
} else {
  sizes = {};
}

try {
  mapData = JSON.parse(fs.readFileSync(mapDFile).toString());
} catch(err) {
  console.log(err);
  giveBadPathMessage('map data');
  explainRelPaths();
  return;
}

const flattenDeep = require('lodash/flattenDeep');
const d3 = require('d3-array');

const geometry = feature(mapData, mapData.objects.states);
geometry.features.forEach(g => {
  if (g.geometry) {
    const ps = flattenDeep(g.geometry.coordinates)
    const xs = ps.filter(function (__, i) {
      return !(i % 2)
    });
    const ys = ps.filter(function (__, i) {
      return (i % 2)
    });
    const width = Math.ceil(getRange(xs));
    const height = Math.ceil(getRange(ys));
    sizes[g.properties.STUSPS] = [width, height];
  }
});
if (update) {
  showUpdatePrompt();
} else {
  showOverwritePrompt();
}

const diff = require('object-diff');


process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (text) => {
  text = text.slice(0, 1).toLowerCase();
  if (text === 'y') {
    fs.writeFile(sizeFile, JSON.stringify(sizes), (err, success) => {
      if (err) {
        showWriteFileErr(err);
      }
      console.log('Wrote the file'.green);
      done();
    })
  } else if (text === 'n') {
    console.log('Canceled writing the file'.red);
    done();
  } else if (text === 'd') {
      console.log(sizes)
    showOptions();
  } else if (text === 'u') {
    if (update && originalSizes) {
      console.log('Updated sizes:'.cyan, '(Unchanged data is not shown)'.blue)
      const changed = diff.custom({
        equal: (a, b) => {
          for (var i = 0; i < a.length; i++) {
            if (b[i] !== a[i]) return false;
          }
          return true;
        }
      }, originalSizes, sizes);
      console.log('New: '.green.bold, JSON.stringify(changed).green);
      const old = {};
      const unChanged = cloneDeep(originalSizes);
      Object.keys(changed).forEach(k => {
        old[k] = originalSizes[k];
        delete unChanged[k];
      })
      console.log('Old: '.red.bold, JSON.stringify(old).red);
      console.log('UnChanged: ', JSON.stringify(unChanged));
    } else {
      console.log('You are not updating, so there\'s no update to show, ' + 'silly goose.'.rainbow);
    }
    showOptions();
  } else if (text === '?') {
    showHelp();
    showOptions();
  }
})

function done() {
  console.log('Byeeeeee!'.rainbow);
  process.exit();
}

// Explain errors
function describeExpectedArgs() {
  console.log(`So you forgot how to use this thing, huh?`)
  console.log(`  Arguments:
    `.cyan + '[0]'.white.bgBlue + ` Path-to-sizes.json: `.cyan + 'String'.blue + `
    `+ '[1]'.white.bgBlue + ` Path-to-map-data.json: `.cyan + 'String'.blue + `
    `+ '[2]'.white.bgBlue + ` update?: `.cyan + 'boolean'.blue + ` - if false or omitted, will overwrite rather than update file.`)
  return;
}

function explainRelPaths() {
  console.log(`** REMEMBER - paths are relative to `.magenta + `your current working directory.`.white.bgMagenta + ' **'.magenta)
  console.log(`* In other words, `.magenta + `YOU ARE THE CENTER OF THE UNIVERSE. *`.magenta);
  return;
}

function giveBadPathMessage(fileType) {
  console.log(`Yo ${fileType} file path be busted, friend.`.red)
  console.log(`    There's nothing there.`.red);
  return;
}

function showWriteFileErr(err) {
  console.log('That didn\'t go as planned...'.yellow);
  console.log(err.toString().red);
  return;
}

function showOverwritePrompt() {
  console.log('Are you sure you want to overwrite ' + sizeFile);
  showOptions();
}

function showUpdatePrompt() {
  console.log('Are you sure you want to update ' + sizeFile);
  showOptions();
}

function showOptions() {
  process.stdout.write('[y/n/d/u/?] '.yellow)
}

function showHelp() {
  console.log('[y]'.green.bold.bgWhite, 'Write the file'.green);
  console.log('[n]'.red.bold.bgWhite, 'Cancel and quit'.red);
  console.log('[d]'.magenta.bold.bgWhite, 'Show the new size data'.magenta);
  console.log('[u]'.cyan.bold.bgWhite, 'Show the changed size data'.cyan);
}

// Helpers
function getRange(arr) {
  return d3.max(arr) - d3.min(arr);
}

// TOPOJSON code from https://unpkg.com/topojson@3.0.0
function feature (topology, o) {
  return o.type === "GeometryCollection"
      ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
      : feature$1(topology, o);
};

function feature$1(topology, o) {
  var id = o.id,
      bbox = o.bbox,
      properties = o.properties == null ? {} : o.properties,
      geometry = object(topology, o);
  return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
      : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
      : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
}

function object(topology, o) {
  var transformPoint = transform(topology.transform),
      arcs = topology.arcs;

  function arc(i, points) {
    if (points.length) points.pop();
    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
      points.push(transformPoint(a[k], k));
    }
    if (i < 0) reverse(points, n);
  }

  function point(p) {
    return transformPoint(p);
  }

  function line(arcs) {
    var points = [];
    for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
    if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
    return points;
  }

  function ring(arcs) {
    var points = line(arcs);
    while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
    return points;
  }

  function polygon(arcs) {
    return arcs.map(ring);
  }

  function geometry(o) {
    var type = o.type, coordinates;
    switch (type) {
      case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
      case "Point": coordinates = point(o.coordinates); break;
      case "MultiPoint": coordinates = o.coordinates.map(point); break;
      case "LineString": coordinates = line(o.arcs); break;
      case "MultiLineString": coordinates = o.arcs.map(line); break;
      case "Polygon": coordinates = polygon(o.arcs); break;
      case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
      default: return null;
    }
    return {type: type, coordinates: coordinates};
  }

  return geometry(o);
}

function transform(transform) {
  if (transform == null) return identity;
  var x0,
      y0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(input, i) {
    if (!i) x0 = y0 = 0;
    var j = 2, n = input.length, output = new Array(n);
    output[0] = (x0 += input[0]) * kx + dx;
    output[1] = (y0 += input[1]) * ky + dy;
    while (j < n) output[j] = input[j], ++j;
    return output;
  };
};

function identity (x) {
  return x;
}

function reverse(array, n) {
  var t, j = array.length, i = j - n;
  while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
};
