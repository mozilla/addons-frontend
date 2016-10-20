import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';

import App from 'disco/containers/App';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('App', () => {
  it('renders its children', () => {
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const root = findRenderedComponentWithType(renderIntoDocument(
      <App i18n={getFakeI18nInst()}>
        <MyComponent />
      </App>
    ), App).getWrappedInstance();

    const rootNode = findDOMNode(root);
    assert.equal(rootNode.tagName.toLowerCase(), 'div');
    assert.equal(rootNode.querySelector('p').textContent, 'The component');
  });
});
