import React, { PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { findRenderedComponentWithType, renderIntoDocument }
  from 'react-addons-test-utils';
import { createStore, combineReducers } from 'redux';

import translate from 'core/i18n/translate';
import { clearError, setError } from 'core/actions/errors';
import { ErrorHandler, withErrorHandling } from 'core/errorHandler';
import errors from 'core/reducers/errors';
import { createFakeApiError } from 'tests/client/core/reducers/test_errors';

class SomeComponentBase extends React.Component {
  static propTypes = {
    errorHandler: PropTypes.object,
  }
  render() {
    return <div />;
  }
}

function createErrorStore() {
  return createStore(combineReducers({ errors }));
}

function createWrappedComponent({ id, store = createErrorStore() } = {}) {
  const SomeComponent = translate({ withRef: true })(SomeComponentBase);
  const ComponentWithErrorHandling =
    withErrorHandling({ id, name: 'SomeComponent' })(SomeComponent);

  const provider = renderIntoDocument(
    <ComponentWithErrorHandling store={store} />
  );
  const component = findRenderedComponentWithType(provider, SomeComponent);

  return { store, component, dom: findDOMNode(provider) };
}

describe('errorHandler', () => {
  describe('withErrorHandling', () => {
    it('provides a unique errorHandler property', () => {
      const { component } = createWrappedComponent();
      const errorHandler = component.props.errorHandler;
      assert.instanceOf(errorHandler, ErrorHandler);
      assert.match(errorHandler.id, /^SomeComponent-/);
    });

    it('creates a unique handler ID per wrapped component', () => {
      const { component: component1 } = createWrappedComponent();
      const { component: component2 } = createWrappedComponent();
      assert.notEqual(component1.props.errorHandler.id,
                      component2.props.errorHandler.id);
    });

    it('creates a unique handler ID per component instance', () => {
      const SomeComponent = translate({ withRef: true })(SomeComponentBase);
      const ComponentWithErrorHandling =
        withErrorHandling({ name: 'SomeComponent' })(SomeComponent);

      const getRenderedComponent = () => {
        const provider = renderIntoDocument(
          <ComponentWithErrorHandling store={createErrorStore()} />
        );
        return findRenderedComponentWithType(provider, SomeComponent);
      };

      const component1 = getRenderedComponent();
      const component2 = getRenderedComponent();

      assert.notEqual(component1.props.errorHandler.id,
                      component2.props.errorHandler.id);
    });

    it('configures an error handler for action dispatching', () => {
      const store = createErrorStore();
      sinon.spy(store, 'dispatch');
      const { component } = createWrappedComponent({ store });

      const errorHandler = component.props.errorHandler;
      const error = new Error();
      errorHandler.handle(error);

      assert.ok(store.dispatch.called);
      assert.deepEqual(store.dispatch.firstCall.args[0],
                       setError({ id: errorHandler.id, error }));
    });

    it('renders an error', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));

      const { dom } = createWrappedComponent({ store, id });
      assert.equal(dom.querySelector('.ErrorHandler-list').textContent,
                   'An unexpected error occurred');
    });

    it('renders multiple error messages', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      const error = createFakeApiError({
        nonFieldErrors: ['first error', 'second error'],
      });
      store.dispatch(setError({ id, error }));

      const { dom } = createWrappedComponent({ store, id });
      const items = dom.querySelectorAll('.ErrorHandler-list li');
      assert(items.length, 'error list was not rendered');
      assert.equal(items[0].textContent, 'first error');
      assert.equal(items[1].textContent, 'second error');
    });

    it('erases cleared errors', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));
      store.dispatch(clearError(id));

      const { dom } = createWrappedComponent({ store, id });
      assert.equal(dom.querySelector('.ErrorHandler-list'), null);
    });

    it('ignores errors sent by other error handlers', () => {
      const store = createErrorStore();
      store.dispatch(setError({
        id: 'another-handler-id', error: new Error(),
      }));

      const { dom } = createWrappedComponent({
        store, id: 'this-handler-id',
      });
      assert.equal(dom.querySelector('.ErrorHandler-list'), null);
    });
  });

  describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
      errorHandler = new ErrorHandler({
        id: 'some-handler', dispatch: sinon.stub(),
      });
    });

    it('dispatches an error', () => {
      const error = new Error();
      errorHandler.handle(error);
      assert.ok(errorHandler.dispatch.called);
      assert.deepEqual(errorHandler.dispatch.firstCall.args[0],
                       setError({ id: errorHandler.id, error }));
    });

    it('clears an error', () => {
      errorHandler.clear();
      assert.ok(errorHandler.dispatch.called);
      assert.deepEqual(errorHandler.dispatch.firstCall.args[0],
                       clearError(errorHandler.id));
    });
  });
});
