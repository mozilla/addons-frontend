import React from 'react';

import App from 'search/containers/App';
import { shallowRender } from '../../utils';

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
