#!/usr/bin/env zx

import {$, path, echo, within, glob} from 'zx';

const root = path.join(__dirname, '..');
const localeDir = path.join(root, 'locale');
const templateFile = path.join(localeDir, '/templates/LC_MESSAGES/amo.pot');

within(async () => {
  const sourceDir = path.join(root, 'src', 'amo');
  const outputDir = path.join(root, 'dist', 'locales');
  const localesConfig = path.join(root, 'babel.config.locales.js');

  await $`babel ${sourceDir} \
    --out-dir ${outputDir} \
    --config-file ${localesConfig} \
    --verbose \
  `;

  const {stdout: output} = await $`git diff --numstat -- ${templateFile}`;

  // git diff --numstat returns the number of insertions and deletions for each file
  // this regex extracts the numbers from the output
  const regex = /([0-9]+).*([0-9]+)/;

  const [, insertions = 0, deletions = 0] = output.match(regex) || [];

  const isLocaleClean = insertions < 2 && deletions < 2;

  if (isLocaleClean) {
    return echo('No locale changes, nothing to update, ending process');
  }

  const poFiles = await glob(`${localeDir}/**/amo.po`);

  for await (const poFile of poFiles) {
    const dir = path.dirname(poFile);
    const stem = path.basename(poFile, '.po');
    const tempFile = path.join(dir, `${stem}.po.tmp`);

    try {
      await $`msgmerge --no-fuzzy-matching -q -o ${tempFile} ${poFile} ${templateFile}`
      await $`mv ${tempFile} ${poFile}`
    } catch (error) {
      await $`rm ${tempFile}`;
      throw new Error(`Error merging ${poFile}`);
    }
  }

  return true;
});

