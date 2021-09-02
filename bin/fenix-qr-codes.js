#!/usr/bin/env node
/* eslint-disable global-require, no-console */

const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');
const QRCode = require('qrcode');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const destDir = path.join(distDir, 'qrcodes');
const lang = 'en-US';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir);
}

(async () => {
  const res = await fetch(
    `https://addons.mozilla.org/api/v5/addons/search/?app=android&promoted=recommended&type=extension&lang=${lang}`
  );
  const { results: addons } = await res.json();

  await Promise.all(
    addons.map(({ id, url }) => {
      const filePath =   path.join(destDir, `${id}.png`);
      let content = url.replace(`/${lang}`, '');
      content = [
        `${content}?utm_campaign=amo-fenix-qr-code`,
        `utm_content=${id}`,
        `utm_medium=referral&utm_source=addons.mozilla.org`,
      ].join('&')
      return QRCode.toFile(filePath, content);
    })
  );
  console.log(addons.length, ' QR codes created');
})();
