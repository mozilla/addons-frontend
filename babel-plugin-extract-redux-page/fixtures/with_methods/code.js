/* @flow */
import * as React from 'react';
import { compose } from 'redux';

type Props = {|
  name: string,
|};

class Component extends React.Component<Props> {
  renderThing(number: number): React.Node {
    return <div>thing {number}</div>;
  }

  render() {
    const thing = this.renderThing(2);
    return <div>{thing}</div>;
  }
}

export default Component;
