import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';

import 'search/css/App.scss';
import { gettext as _ } from 'core/utils';


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
        {children}
      </div>
    );
  }
}
