#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const util = require('node:util');
const zlib = require('zlib');

const glob = require('glob');
const bytes = require('bytes');

const configPath = path.resolve(path.join(path.dirname(__filename), '..', 'package.json'));
const config = JSON.parse(fs.readFileSync(configPath)).bundlewatch;

let hasError = false;

config.forEach((item) => {
  const filePaths = glob.sync(item.path);
  const formattedMaxSize = item.maxSize;
  const maxSize = bytes.parse(item.maxSize);
  filePaths.forEach((filePath) => {
    const fileSize = zlib.gzipSync(fs.readFileSync(filePath)).length;
    const formattedFileSize = bytes.format(fileSize);
    if (fileSize > maxSize) {
      hasError = true;
      console.error(util.styleText(['red', 'bold'], 'FAIL'), `${filePath}: ${formattedFileSize} > ${formattedMaxSize} (gzip)`);
    } else {
      console.log(util.styleText(['green', 'bold'], 'PASS'), `${filePath}: ${formattedFileSize} <= ${formattedMaxSize} (gzip)`);
    }
  });
});

if (hasError) {
  console.log(util.styleText(['red', 'bold'], 'FAIL'));
} else {
  console.log(util.styleText(['green', 'bold'], 'PASS'));
}

if (hasError) {
  process.exit(1);
}
