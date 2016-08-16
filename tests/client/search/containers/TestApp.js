import React from 'react';

import App from 'search/containers/App';
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
    // First child is <Helmet />.
    // Second child is <NavBar />.
    // Third child is the <div className="App"> wrapper.
    const wrapper = root.props.children[2];
    assert.equal(wrapper.props.className, 'App');
    assert.equal(wrapper.props.children.type, MyComponent);
  });
});
