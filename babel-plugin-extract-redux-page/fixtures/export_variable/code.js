/* @flow */
import * as React from 'react';
import { compose } from 'redux';

class Component extends React.Component {
  render() {
    const { name } = this.props;
    return <div>{name}</div>;
  }
}

const Wrapper = compose()(Component);

export default Wrapper;
