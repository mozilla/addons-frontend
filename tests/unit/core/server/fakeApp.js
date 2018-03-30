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
  },
};

export const fakeSRIData = {
  'disco-blah.css': 'sha512-disco-css',
  'search-blah.css': 'sha512-search-css',
  'disco-blah.js': 'sha512-disco-js',
  'search-blah.js': 'sha512-search-js',
};

export default class FakeApp extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;
    return (
      <div>
        <Helmet defaultTitle="test title">
          <meta name="description" content="test meta" />
        </Helmet>
        {children}
      </div>
    );
  }
}
