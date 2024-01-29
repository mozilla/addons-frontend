/* @flow */
import * as React from 'react';

class Component extends React.Component {
  render() {
    const { name } = this.props;
    return <div>{name}</div>;
  }
}

export default Component;
