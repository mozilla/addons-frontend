/* @flow */
import * as React from 'react';
import { compose } from 'redux';
function RenderFunction(props) {
  const { name } = props;
  return <div>{name}</div>;
}
class Component extends React.Component {
  render() {
    return <RenderFunction {...this.props} />;
  }
}
const Wrapper = compose()(Component);
export default Wrapper;
