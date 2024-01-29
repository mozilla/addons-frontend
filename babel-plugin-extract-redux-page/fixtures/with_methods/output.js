/* @flow */
import * as React from 'react';
import { compose } from 'redux';
type Props = {|
  name: string,
|};
function RenderFunction(
  props: Props & {
    renderThing: (number: number) => React.Node,
  },
) {
  const thing = props.renderThing(2);
  return <div>{thing}</div>;
}
class Component extends React.Component<Props> {
  renderThing(number: number): React.Node {
    return <div>thing {number}</div>;
  }
  render() {
    return <RenderFunction {...this.props} renderThing={this.renderThing} />;
  }
}
export default Component;
