#!/usr/bin/env node
/* eslint-disable global-require, no-console */

const path = require('path');

const fetch = require('node-fetch');
const QRCode = require('qrcode');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const lang = 'en-US';

(async () => {
  const res = await fetch(
    `https://addons.mozilla.org/api/v5/addons/search/?app=android&promoted=recommended&type=extension&lang=${lang}`
  );
  const { results: addons } = await res.json();

  await Promise.all(
    addons.map(({ id, url }) => {
      const filePath =   path.join(distDir, `${id}.png`);
      return QRCode.toFile(filePath, url.replace(`/${lang}`, ''));
    })
  );
  console.log(addons.length, ' QR codes created');
})();
