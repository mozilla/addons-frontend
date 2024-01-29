/* @flow */
import * as React from 'react';
function RenderFunction(props) {
  const { name } = props;
  return <div>{name}</div>;
}
class Component extends React.Component {
  render() {
    return <RenderFunction {...this.props} />;
  }
}
export default Component;
