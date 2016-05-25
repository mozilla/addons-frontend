/* eslint-disable no-console */
import fs from 'fs';
import config from 'config';
import chalk from 'chalk';

import webpackConfig from './webpack.prod.config.babel';

const appName = config.get('appName');

if (!appName) {
  console.log(
    chalk.red('Please specify the appName with NODE_APP_INSTANCE'));
  process.exit(1);
}

if (process.env.NODE_ENV !== 'production') {
  console.log(
    chalk.red('This should be run with NODE_ENV="production"'));
  process.exit(1);
}

const babelrc = fs.readFileSync('./.babelrc');
const babelrcObject = JSON.parse(babelrc);
const babelPlugins = babelrcObject.plugins || [];

// Create UTC creation date in the correct format.
const potCreationDate = new Date().toISOString()
  .replace('T', ' ')
  .replace(/:\d{2}.\d{3}Z/, '+0000');

const babelL10nPlugins = [
  ['babel-gettext-extractor', {
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
      'i18n.gettext': ['msgid'],
      'i18n.dgettext': ['domain', 'msgid'],
      'i18n.ngettext': ['msgid', 'msgid_plural', 'count'],
      'i18n.dngettext': ['domain', 'msgid', 'msgid_plural', 'count'],
      'i18n.pgettext': ['msgctxt', 'msgid'],
      'i18n.dpgettext': ['domain', 'msgctxt', 'msgid'],
      'i18n.npgettext': ['msgctxt', 'msgid', 'msgid_plural', 'count'],
      'i18n.dnpgettext': ['domain', 'msgctxt', 'msgid', 'msgid_plural', 'count'],
    },
    fileName: `locale/templates/LC_MESSAGES/${appName}.pot`,
    baseDirectory: process.cwd(),
  }],
];

const BABEL_QUERY = Object.assign({}, babelrcObject, {
  plugins: babelPlugins.concat(babelL10nPlugins),
});

const newLoaders = webpackConfig.module.loaders.slice(0);
// Assumes the js loader is the first one.
newLoaders[0].query = BABEL_QUERY;

export default Object.assign({}, webpackConfig, {
  entry: { [appName]: `src/${appName}/client` },
  module: {
    loaders: newLoaders,
  },
});
