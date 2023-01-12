#!/usr/bin/env node

const pump = require('pump');
const split = require('split2');
const { Transform } = require('readable-stream');

const {
  createParseFunction,
  createTransformFunction,
  parseOptions,
} = require('../src/pino-mozlog/index');

const options = parseOptions(process.argv.slice(2));
const mozlogTransport = new Transform({
  objectMode: true,
  transform: createTransformFunction({ options }),
});

pump(
  process.stdin,
  split(createParseFunction({ options })),
  mozlogTransport,
  process.stdout
);
