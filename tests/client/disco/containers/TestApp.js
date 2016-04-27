import React from 'react';

import App from 'disco/containers/App';
import { shallowRender } from 'tests/client/helpers';

describe('App', () => {
  it('renders its children', () => {
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const root = shallowRender(<App><MyComponent /></App>);
    assert.equal(root.type, 'div');
    assert.equal(root.props.children.type, MyComponent);
  });
});
