/* eslint-disable no-else-return */
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';

export default {
  debug: false,
  assets: {
    images: {
      extensions: ['jpeg', 'jpg', 'png', 'gif'],
      parser: WebpackIsomorphicToolsPlugin.url_loader_parser,
    },
    fonts: {
      extensions: ['otf', 'woff', 'woff2'],
      parser: WebpackIsomorphicToolsPlugin.url_loader_parser,
    },
    svg: {
      extensions: ['svg'],
      parser: WebpackIsomorphicToolsPlugin.url_loader_parser,
    },
    style_modules: {
      extensions: ['css', 'scss'],
      filter: (module, regex, options, log) => {
        if (options.development) {
          // in development mode there's webpack "style-loader",
          // so the module.name is not equal to module.name
          return WebpackIsomorphicToolsPlugin.style_loader_filter(
            module,
            regex,
            options,
            log,
          );
        } else {
          // in production mode there's no webpack "style-loader",
          // so the module.name will be equal to the asset path
          return regex.test(module.name);
        }
      },
      path: (module, options, log) => {
        if (options.development) {
          // in development mode there's webpack "style-loader",
          // so the module.name is not equal to module.name
          return WebpackIsomorphicToolsPlugin.style_loader_path_extractor(
            module,
            options,
            log,
          );
        } else {
          // in production mode there's no webpack "style-loader",
          // so the module.name will be equal to the asset path
          return module.name;
        }
      },
      parser: (module, options, log) => {
        if (options.development) {
          return WebpackIsomorphicToolsPlugin.css_modules_loader_parser(
            module,
            options,
            log,
          );
        } else {
          // in production mode there's Extract Text Loader which extracts CSS text away
          return module.source;
        }
      },
    },
    videos: {
      extensions: ['mp4', 'webm'],
      parser: WebpackIsomorphicToolsPlugin.url_loader_parser,
    },
  },
};
