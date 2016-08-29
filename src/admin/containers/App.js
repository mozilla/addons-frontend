import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';

import { gettext as _ } from 'core/utils';
import NavBar from 'search/components/NavBar';

import 'admin/css/App.scss';

export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;
    return (
      <div className="search-page">
        <Helmet
          defaultTitle={_('Add-ons Search')}
        />
        <NavBar />
        <div className="App">
          {children}
        </div>
      </div>
    );
  }
}
