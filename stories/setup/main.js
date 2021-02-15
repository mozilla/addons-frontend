require('@babel/register');

const webpackProdConfig = require('webpack.prod.config.babel').default;

const { getPlugins, getStyleRules } = require('../../webpack-common');

module.exports = {
  stories: ['../index.js'],
  addons: ['storybook-addon-rtl/register', '@storybook/addon-docs'],
  webpackFinal: (config) => {
    return {
      ...config,
      node: webpackProdConfig.node,
      optimization: {
        minimizer: [],
      },
      module: {
        ...config.module,
        rules: [
          ...config.module.rules,
          ...getStyleRules({ bundleStylesWithJs: true }),
        ],
      },
      plugins: [...config.plugins, ...getPlugins()],
      resolve: webpackProdConfig.resolve,
    };
  },
};
