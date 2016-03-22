import React, { PropTypes } from 'react';

import 'search/css/App.scss';


export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;
    return children;
  }
}
