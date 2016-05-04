import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';

import 'disco/css/App.scss';
import { gettext as _ } from 'core/utils';


export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;
    return (
      <div className="disco-pane">
        <Helmet
          defaultTitle={_('Discover Add-ons')}
        />
        {children}
      </div>
    );
  }
}
