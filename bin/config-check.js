#!/usr/bin/env node
/* eslint-disable global-require, no-console */

// This script exits with an error if there are local configs that could
// pollute the test suite.

const fs = require('fs');
const path = require('path');

const chalk = require('chalk');

const root = path.resolve(path.join(path.dirname(__filename), '..'));
if (!fs.statSync(root).isDirectory()) {
  throw new Error(`Oops, detected the wrong root? ${root}`);
}

const configDir = path.join(root, 'config');
if (!fs.statSync(configDir).isDirectory()) {
  throw new Error(`Oops, detected the wrong config dir? ${configDir}`);
}

const disallowedFiles = fs
  .readdirSync(configDir)
  // Disallow any local configs except for development configs.
  .filter((name) => {
    return (
      name.startsWith('local') &&
      !name.startsWith('local-development') &&
      !name.endsWith('.dist')
    );
  })
  .map((name) => path.join(configDir, name).replace(process.cwd(), '.'));

if (disallowedFiles.length) {
  console.log(
    chalk.red(
      'These local config files are not allowed because they might pollute ' +
        'the test environment. Prefix them with local-development- or remove ' +
        'them:',
    ),
  );
  console.log(chalk.red(disallowedFiles.join('\n')));
  process.exit(1);
}
