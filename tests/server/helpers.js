import cheerio from 'cheerio';
import { camelizeKeys as camelCaseKeys } from 'humps';

import { runServer } from 'core/server/base';

export function checkSRI(res) {
  const $ = cheerio.load(res.text);
  const $stylesheets = $('link[rel=stylesheet]');
  expect($stylesheets.length > 0).toBeTruthy();
  $stylesheets.each((i, elem) => {
    const $elem = $(elem);
    expect($elem.attr('integrity')).toContain('sha512');
    expect($elem.attr('crossorigin')).toEqual('anonymous');
  });

  const $script = $('script[src]');
  expect($script.length > 0).toBeTruthy();
  $script.each((i, elem) => {
    const $elem = $(elem);
    if ($elem.attr('src').includes('analytics.js')) {
      throw new Error('Google analytics should not be included in server tests.');
    }
    expect($elem.attr('integrity')).toContain('sha512');
    expect($elem.attr('crossorigin')).toEqual('anonymous');
  });
}

export function parseCSP(rawCsp) {
  return camelCaseKeys(
    rawCsp
      .split(';')
      .map((part) => part.trim().split(' '))
      .reduce((parts, [partName, ...partValues]) => ({
        ...parts,
        [partName]: partValues,
      }), {}));
}

export function runTestServer(options = {}) {
  return runServer({
    listen: false,
    exitProcess: false,
    ...options,
  });
}
