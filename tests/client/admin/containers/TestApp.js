import React from 'react';

import App from 'admin/containers/App';
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
    assert.equal(root.props.children[1].type, MyComponent);
  });
});
