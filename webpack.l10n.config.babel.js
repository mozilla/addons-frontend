/* eslint-disable no-console, import/no-extraneous-dependencies */
import fs from 'fs';

import chalk from 'chalk';
import config from 'config';
import webpack from 'webpack';

import { getRules } from './webpack-common';
import webpackConfig from './webpack.prod.config.babel';

const appName = config.get('appName');

if (!appName) {
  console.log(chalk.red('Please specify the appName with NODE_APP_INSTANCE'));
  process.exit(1);
}

if (process.env.NODE_ENV !== 'production') {
  console.log(chalk.red('This should be run with NODE_ENV="production"'));
  process.exit(1);
}

const babelrc = fs.readFileSync('./.babelrc');
const babelrcObject = JSON.parse(babelrc);
const babelPlugins = babelrcObject.plugins || [];

// Create UTC creation date in the correct format.
const potCreationDate = new Date()
  .toISOString()
  .replace('T', ' ')
  .replace(/:\d{2}.\d{3}Z/, '+0000');

const babelL10nPlugins = [
  [
    'module:babel-gettext-extractor',
    {
      headers: {
        'Project-Id-Version': appName,
        'Report-Msgid-Bugs-To': 'EMAIL@ADDRESS',
        'POT-Creation-Date': potCreationDate,
        'PO-Revision-Date': 'YEAR-MO-DA HO:MI+ZONE',
        'Last-Translator': 'FULL NAME <EMAIL@ADDRESS>',
        'Language-Team': 'LANGUAGE <LL@li.org>',
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Transfer-Encoding': '8bit',
        'plural-forms': 'nplurals=2; plural=(n!=1);',
      },
      functionNames: {
        gettext: ['msgid'],
        dgettext: ['domain', 'msgid'],
        ngettext: ['msgid', 'msgid_plural', 'count'],
        dngettext: ['domain', 'msgid', 'msgid_plural', 'count'],
        pgettext: ['msgctxt', 'msgid'],
        dpgettext: ['domain', 'msgctxt', 'msgid'],
        npgettext: ['msgctxt', 'msgid', 'msgid_plural', 'count'],
        dnpgettext: ['domain', 'msgctxt', 'msgid', 'msgid_plural', 'count'],
      },
      fileName: `locale/templates/LC_MESSAGES/${appName}.pot`,
      baseDirectory: process.cwd(),
      stripTemplateLiteralIndent: true,
    },
  ],
];

const babelOptions = Object.assign({}, babelrcObject, {
  plugins: babelPlugins.concat(babelL10nPlugins),
});

export default Object.assign({}, webpackConfig, {
  entry: { [appName]: `${appName}/client` },
  module: {
    rules: getRules({ babelOptions }),
  },
  plugins: [
    // Don't generate modules for locale files.
    new webpack.IgnorePlugin(new RegExp(`locale\\/.*\\/${appName}\\.js$`)),
    ...webpackConfig.plugins,
  ],
});
