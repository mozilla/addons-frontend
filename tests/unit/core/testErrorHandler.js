import React from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { findRenderedComponentWithType, renderIntoDocument }
  from 'react-addons-test-utils';
import { createStore, combineReducers } from 'redux';

import I18nProvider from 'core/i18n/Provider';
import { createApiError } from 'core/api/index';
import { ERROR_UNKNOWN } from 'core/constants';
import translate from 'core/i18n/translate';
import { clearError, setError } from 'core/actions/errors';
import { ErrorHandler, withErrorHandler, withErrorHandling }
  from 'core/errorHandler';
import errors from 'core/reducers/errors';
import { getFakeI18nInst } from 'tests/unit/helpers';
import { createFakeApiError } from 'tests/unit/core/reducers/test_errors';
import ErrorList from 'ui/components/ErrorList';

class SomeComponentBase extends React.Component {
  static propTypes = {
    errorHandler: PropTypes.object,
  }
  render() {
    return <div className="SomeComponent">Component text</div>;
  }
}

function createErrorStore() {
  return createStore(combineReducers({ errors }));
}

function createWrappedComponent({
  id, store = createErrorStore(), decorator = withErrorHandler,
  customProps = {}, ...options
} = {}) {
  const SomeComponent = translate({ withRef: true })(SomeComponentBase);
  const ComponentWithErrorHandling = decorator({
    id, name: 'SomeComponent', ...options,
  })(SomeComponent);

  const tree = renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <ComponentWithErrorHandling store={store} {...customProps} />
    </I18nProvider>
  );
  const component = findRenderedComponentWithType(tree, SomeComponent);

  return { store, component, dom: findDOMNode(tree), tree };
}

describe('errorHandler', () => {
  describe('withErrorHandler', () => {
    it('provides a unique errorHandler property', () => {
      const { component } = createWrappedComponent();
      const errorHandler = component.props.errorHandler;
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorHandler.id).toMatch(/^SomeComponent-/);
    });

    it('creates a unique handler ID per wrapped component', () => {
      const { component: component1 } = createWrappedComponent();
      const { component: component2 } = createWrappedComponent();
      expect(component1.props.errorHandler.id).not.toEqual(component2.props.errorHandler.id);
    });

    it('creates a unique handler ID per component instance', () => {
      const SomeComponent = translate({ withRef: true })(SomeComponentBase);
      const ComponentWithErrorHandling =
        withErrorHandler({ name: 'SomeComponent' })(SomeComponent);

      const getRenderedComponent = () => {
        const provider = renderIntoDocument(
          <ComponentWithErrorHandling store={createErrorStore()} />
        );
        return findRenderedComponentWithType(provider, SomeComponent);
      };

      const component1 = getRenderedComponent();
      const component2 = getRenderedComponent();

      expect(component1.props.errorHandler.id).not.toEqual(component2.props.errorHandler.id);
    });

    it('configures an error handler for action dispatching', () => {
      const store = createErrorStore();
      sinon.spy(store, 'dispatch');
      const { component } = createWrappedComponent({ store });

      const errorHandler = component.props.errorHandler;
      const error = new Error();
      errorHandler.handle(error);

      expect(store.dispatch.called).toBeTruthy();
      expect(store.dispatch.firstCall.args[0]).toEqual(setError({ id: errorHandler.id, error }));
    });

    it('passes through wrapped component properties', () => {
      const { component } = createWrappedComponent({
        customProps: { color: 'red' },
      });

      expect(component.props.color).toEqual('red');
    });
  });

  describe('withErrorHandling', () => {
    it('renders a generic error above component content', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));

      const { dom, tree } = createWrappedComponent({
        store, id, decorator: withErrorHandling,
      });
      const errorList = findRenderedComponentWithType(tree, ErrorList);
      expect(errorList.props.code).toEqual(ERROR_UNKNOWN);
      expect(errorList.props.messages).toEqual([]);

      // It also renders component content:
      expect(dom.querySelector('.SomeComponent').textContent).toEqual('Component text');
    });

    it('passes a nested API response object', () => {
      const id = 'some-handler-id';

      // This is a possible but unlikely API response. Make sure
      // it gets passed to ErrorList correctly.
      const nestedMessage = { nested: { message: 'end' } };
      const store = createErrorStore();
      const error = createApiError({
        response: { status: 401 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: nestedMessage },
      });
      store.dispatch(setError({ id, error }));

      const { tree } = createWrappedComponent({
        store, id, decorator: withErrorHandling,
      });
      const errorList = findRenderedComponentWithType(tree, ErrorList);
      expect(errorList.props.messages).toEqual([nestedMessage]);
    });

    it('renders component content when there is no error', () => {
      const { dom, tree } = createWrappedComponent({
        decorator: withErrorHandling,
      });
      expect(() => findRenderedComponentWithType(tree, ErrorList))
        .toThrowError(/Did not find exactly one match/);
      expect(dom.textContent).toEqual('Component text');
    });

    it('renders multiple error messages', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      const error = createFakeApiError({
        nonFieldErrors: ['first error', 'second error'],
      });
      store.dispatch(setError({ id, error }));

      const { tree } = createWrappedComponent({
        store, id, decorator: withErrorHandling,
      });

      const errorList = findRenderedComponentWithType(tree, ErrorList);
      expect(errorList.props.messages).toEqual(['first error', 'second error']);
    });

    it('erases cleared errors', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));
      store.dispatch(clearError(id));

      const { tree } = createWrappedComponent({
        store, id, decorator: withErrorHandling,
      });
      expect(() => findRenderedComponentWithType(tree, ErrorList))
        .toThrowError(/Did not find exactly one match/);
    });

    it('ignores errors sent by other error handlers', () => {
      const store = createErrorStore();
      store.dispatch(setError({
        id: 'another-handler-id', error: new Error(),
      }));

      const { tree } = createWrappedComponent({
        store, id: 'this-handler-id', decorator: withErrorHandling,
      });
      expect(() => findRenderedComponentWithType(tree, ErrorList))
        .toThrowError(/Did not find exactly one match/);
    });

    it('passes through wrapped component properties without an error', () => {
      const { component } = createWrappedComponent({
        decorator: withErrorHandling,
        customProps: { color: 'red' },
      });
      expect(component.props.color).toEqual('red');
    });

    it('passes through wrapped component properties with an error', () => {
      const id = 'some-id';
      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));

      const { component } = createWrappedComponent({
        id,
        store,
        decorator: withErrorHandling,
        customProps: { color: 'red' },
      });
      expect(component.props.color).toEqual('red');
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
      expect(errorHandler.dispatch.called).toBeTruthy();
      expect(errorHandler.dispatch.firstCall.args[0])
        .toEqual(setError({ id: errorHandler.id, error }));
    });

    it('clears an error', () => {
      errorHandler.clear();
      expect(errorHandler.dispatch.called).toBeTruthy();
      expect(errorHandler.dispatch.firstCall.args[0]).toEqual(clearError(errorHandler.id));
    });

    it('tells you if it has an error', () => {
      const handler = new ErrorHandler({ capturedError: new Error() });
      expect(handler.hasError()).toBe(true);
    });

    it('tells you if it does not have an error', () => {
      const handler = new ErrorHandler();
      expect(handler.hasError()).toBe(false);
    });
  });
});
