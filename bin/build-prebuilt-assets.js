#!/usr/bin/env node
/*
 * Build the production webpack assets once per environment at image build
 * time and stash each set under dist-prebuilt/<env>/. At container start
 * bin/select-prebuilt-assets.js links the right set into place, so no webpack
 * build has to run when the app boots.
 * See https://github.com/mozilla/addons/issues/2184
 *
 * The env-specific values (apiHost, baseURL, fxaConfig, extensionWorkshopUrl,
 * langs, ...) are baked into the client bundle via webpack's DefinePlugin
 * (CLIENT_CONFIG), so we genuinely need a separate bundle per environment --
 * a single generic bundle can't serve different apiHosts to the browser.
 *
 * Usage:
 *   node bin/build-prebuilt-assets.js
 *   PREBUILD_ENVS=stage,prod node bin/build-prebuilt-assets.js
 */
const path = require('path');
const { execSync } = require('child_process');

const fs = require('fs-extra');

const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'dist-prebuilt');

// The three runtime asset artifacts a build produces, relative to the repo
// root. These are the only outputs that differ per environment.
const ARTIFACTS = [
  { from: 'webpack-assets.json', to: 'webpack-assets.json' },
  { from: path.join('dist', 'sri.json'), to: 'sri.json' },
  { from: path.join('dist', 'static'), to: 'static' },
];

const envs = (process.env.PREBUILD_ENVS || 'dev,stage,prod')
  .split(',')
  .map((env) => env.trim())
  .filter(Boolean);

fs.removeSync(OUT_ROOT);

for (const env of envs) {
  // eslint-disable-next-line no-console
  console.log(`\n=== Building prebuilt assets for NODE_CONFIG_ENV=${env} ===`);

  // `npm run build` runs `clean` first, so each env starts from a clean dist.
  execSync('npm run build', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, NODE_CONFIG_ENV: env },
  });

  const dest = path.join(OUT_ROOT, env);
  fs.ensureDirSync(dest);

  for (const { from, to } of ARTIFACTS) {
    const src = path.join(ROOT, from);
    if (!fs.existsSync(src)) {
      throw new Error(
        `Expected build artifact "${from}" for env "${env}" was not produced.`,
      );
    }
    fs.moveSync(src, path.join(dest, to), { overwrite: true });
  }

  // eslint-disable-next-line no-console
  console.log(`Stored ${env} assets in ${path.relative(ROOT, dest)}`);
}

// eslint-disable-next-line no-console
console.log(`\nPrebuilt assets ready for: ${envs.join(', ')}`);
