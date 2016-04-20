import React, { PropTypes } from 'react';

import 'disco/css/App.scss';


export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;
    return (
      <div className="disco-pane">
        {children}
      </div>
    );
  }
}
