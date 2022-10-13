import PropTypes from 'prop-types';
import * as React from 'react';
import { Helmet } from 'react-helmet';

export const fakeAssets = {
  styles: {
    amo: '/bar/amo-blah.css',
    search: '/search-blah.css',
  },
  javascript: {
    amo: '/foo/amo-blah.js',
    search: '/search-blah.js',
    i18n: '/blah/amo-i18n.js',
  },
  assets: {
    './src/fonts/woff2/Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2': 'Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2',
  },
};
export const fakeSRIData = {
  'amo-blah.css': 'sha512-amo-css',
  'search-blah.css': 'sha512-search-css',
  'amo-blah.js': 'sha512-amo-js',
  'search-blah.js': 'sha512-search-js',
  'amo-i18n.js': 'sha512-amo-i18n-js',
  'Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2': 'sha512-amo-woff2',
};
export default class FakeApp extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

  render() {
    const {
      children,
    } = this.props;
    return <div>
        <Helmet defaultTitle="test title">
          <meta name="description" content="test meta" />
          <link rel="canonical" href="/" />
          <script type="application/ld+json">{`{}`}</script>
        </Helmet>
        {children}
      </div>;
  }

}