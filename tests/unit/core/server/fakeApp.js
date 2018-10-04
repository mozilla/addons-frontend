import PropTypes from 'prop-types';
import * as React from 'react';
import Helmet from 'react-helmet';

export const fakeAssets = {
  styles: {
    disco: '/bar/disco-blah.css',
    search: '/search-blah.css',
  },
  javascript: {
    disco: '/foo/disco-blah.js',
    search: '/search-blah.js',
    hct: '/blah/disco-hct.js',
    i18n: '/blah/disco-i18n.js',
  },
};

export const fakeSRIData = {
  'disco-blah.css': 'sha512-disco-css',
  'search-blah.css': 'sha512-search-css',
  'disco-blah.js': 'sha512-disco-js',
  'search-blah.js': 'sha512-search-js',
  'disco-hct.js': 'sha512-disco-hct-js',
  'disco-i18n.js': 'sha512-disco-i18n-js',
};

export default class FakeApp extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

  render() {
    const { children } = this.props;
    return (
      <div>
        <Helmet defaultTitle="test title">
          <meta name="description" content="test meta" />
          <link rel="canonical" href="/" />
          <script type="application/ld+json">{`{}`}</script>
        </Helmet>
        {children}
      </div>
    );
  }
}
