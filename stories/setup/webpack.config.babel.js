import 'core/polyfill';
import config from 'config';
import fs from 'fs';
import path from 'path';
import autoprefixer from 'autoprefixer';
import webpack from 'webpack';
import { getClientConfig } from 'core/utils';

module.exports = {
	module: {
		rules: [
			{
				test: /\.svg$/,
				use: [{ loader: 'svg-url-loader', options: { limit: 10000 } }],
			},
			{
				test: /\.scss$/,
				use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader', options: { importLoaders: 2 } },
					{
						loader: 'postcss-loader',
						options: {
							plugins: [
								autoprefixer({
									browsers: ['last 2 versions'],
									grid: false,
								}),
							],
						},
					},
					{ loader: 'sass-loader', options: { outputStyle: 'expanded' } },
				],
			},
		],
	},
	// The following plugins are needed to help handle
	// server-side imported components such as core/logger.
	// Is this the best way??
	plugins: [
		new webpack.DefinePlugin({
			CLIENT_CONFIG: JSON.stringify(getClientConfig(config)),
		}),

		new webpack.NormalModuleReplacementPlugin(
			/config$/,
			'core/client/config.js',
		),
	],
	resolve: {
		alias: {
			normalize: 'normalize.css/normalize.css',
		},
		modules: [path.resolve('./src'), 'node_modules'],
	},
};
