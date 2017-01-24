import React, { PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';
import { loadFail as reduxConnectLoadFail } from 'redux-connect/lib/store';

import { createApiError } from 'core/api';
import { handleResourceErrors } from 'core/resourceErrors/decorator';
import createStore from 'amo/store';


class SomeComponentBase extends React.Component {
  static propTypes = {
    counter: PropTypes.number,
  }
  render() {
    if (this.props.counter !== undefined) {
      return <div>Counter: {this.props.counter}</div>;
    }
    return <div>Static Content</div>;
  }
}

function renderToDOM({ store = createStore(), ...props } = {}) {
  const SomeComponent = handleResourceErrors(SomeComponentBase);
  const root = renderIntoDocument(
    <SomeComponent store={store} {...props} />
  );
  return findDOMNode(root);
}

describe('core/resourceErrors/decorator', () => {
  describe('handleResourceErrors', () => {
    it('renders the wrapped component in lieu of errors', () => {
      const rootNode = renderToDOM();
      assert.include(rootNode.textContent, 'Static Content');
    });

    it('passes through arbitrary properties', () => {
      const rootNode = renderToDOM({ counter: 2 });
      assert.include(rootNode.textContent, 'Counter: 2');
    });

    it('renders redux-connect errors as resource errors', () => {
      const store = createStore();
      const apiError = createApiError({
        apiURL: 'https://some-url',
        response: { status: 404 },
      });
      store.dispatch(reduxConnectLoadFail('someKey', apiError));

      const rootNode = renderToDOM({ store });
      assert.include(rootNode.textContent, 'Not Found');
    });
  });
});
