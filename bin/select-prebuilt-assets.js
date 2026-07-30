#!/usr/bin/env node
/*
 * Link the prebuilt assets for the current NODE_CONFIG_ENV (produced by
 * bin/build-prebuilt-assets.js at image build time) into the canonical
 * runtime locations the server reads:
 *
 *   <root>/webpack-assets.json   (webpack-isomorphic-tools, via basePath)
 *   <root>/dist/sri.json         (src/amo/server/base.js)
 *   <root>/dist/static/          (src/amo/middleware/staticAssets.js)
 *
 * This runs at container start not `npm run build`, so booting is
 * just the cost of a few symlinks rather than a 2-5 min webpack build.
 * See https://github.com/mozilla/addons/issues/2184
 *
 * Usage:
 *   NODE_CONFIG_ENV=stage node bin/select-prebuilt-assets.js
 */
const path = require('path');

const fs = require('fs-extra');

const ROOT = path.resolve(__dirname, '..');
const env = process.env.NODE_CONFIG_ENV || 'prod';
const src = path.join(ROOT, 'dist-prebuilt', env);

if (!fs.existsSync(src)) {
  // eslint-disable-next-line no-console
  console.error(
    `No prebuilt assets for NODE_CONFIG_ENV="${env}" (looked in ${path.relative(
      ROOT,
      src,
    )}). Did the image build run bin/build-prebuilt-assets.js for this env?`,
  );
  process.exit(1);
}

// (link target, canonical runtime location)
const LINKS = [
  ['webpack-assets.json', 'webpack-assets.json'],
  ['sri.json', path.join('dist', 'sri.json')],
  ['static', path.join('dist', 'static')],
];

for (const [artifact, canonical] of LINKS) {
  const target = path.join(src, artifact);
  const linkPath = path.join(ROOT, canonical);
  fs.ensureDirSync(path.dirname(linkPath));
  fs.removeSync(linkPath);
  fs.ensureSymlinkSync(target, linkPath);
}

// eslint-disable-next-line no-console
console.log(`Selected prebuilt assets for NODE_CONFIG_ENV=${env}`);
