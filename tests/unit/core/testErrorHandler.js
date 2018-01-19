import React from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { findRenderedComponentWithType, renderIntoDocument }
  from 'react-dom/test-utils';
import { createStore, combineReducers } from 'redux';
import { shallow } from 'enzyme';

import I18nProvider from 'core/i18n/Provider';
import { createApiError } from 'core/api/index';
import { ERROR_UNKNOWN } from 'core/constants';
import translate from 'core/i18n/translate';
import { clearError, setError } from 'core/actions/errors';
import {
  ErrorHandler,
  normalizeFileNameId,
  withErrorHandler,
  withFixedErrorHandler,
  withRenderedErrorHandler,
} from 'core/errorHandler';
import errors from 'core/reducers/errors';
import { fakeI18n } from 'tests/unit/helpers';
import { createFakeApiError } from 'tests/unit/core/reducers/test_errors';
import ErrorList from 'ui/components/ErrorList';

class SomeComponentBase extends React.Component {
  static propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
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
  const SomeComponent = translate()(SomeComponentBase);
  const ComponentWithErrorHandling = decorator({
    id, name: 'SomeComponent', ...options,
  })(SomeComponent);

  const tree = renderIntoDocument(
    <I18nProvider i18n={fakeI18n()}>
      <ComponentWithErrorHandling store={store} {...customProps} />
    </I18nProvider>
  );
  const component = findRenderedComponentWithType(tree, SomeComponent);

  return { store, component, dom: findDOMNode(tree), tree };
}

describe(__filename, () => {
  describe('withErrorHandler', () => {
    it('provides a unique errorHandler property', () => {
      const { component } = createWrappedComponent();
      const { errorHandler } = component.props;
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorHandler.id).toMatch(/^SomeComponent-/);
    });

    it('throws an error if both `id` and `extractId` parameters are given', () => {
      expect(() => {
        createWrappedComponent({
          id: 'error-handler-id',
          extractId: () => 'unique-id',
        });
      }).toThrow('You can define either `id` or `extractId` but not both.');
    });

    it('throws an error if `extractId` is not a function', () => {
      expect(() => {
        createWrappedComponent({
          extractId: 'invalid type',
        });
      }).toThrow(
        '`extractId` must be a function taking `ownProps` as unique argument.'
      );
    });

    it('creates an error handler ID with `extractId`', () => {
      const { component } = createWrappedComponent({
        // Passed to the wrapped component.
        customProps: {
          propWithUniqueValue: '1234',
        },
        // Passed to the error handler HOC.
        extractId: (ownProps) => ownProps.propWithUniqueValue,
      });
      expect(component.props.errorHandler.id).toEqual('SomeComponent-1234');
    });

    it('creates a unique handler ID per wrapped component', () => {
      const { component: component1 } = createWrappedComponent();
      const { component: component2 } = createWrappedComponent();
      expect(component1.props.errorHandler.id).not.toEqual(component2.props.errorHandler.id);
    });

    it('creates a unique handler ID per component instance', () => {
      const SomeComponent = translate()(SomeComponentBase);
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

    it('allows you to set a custom error handler', () => {
      const errorHandler = new ErrorHandler({
        id: 'my-custom-id',
      });
      const { component } = createWrappedComponent({
        customProps: { errorHandler },
      });
      expect(component.props.errorHandler).toBe(errorHandler);
      expect(component.props.errorHandler.id).toEqual('my-custom-id');
    });

    it('adjusts the dispatch property of a custom error handler', () => {
      const store = createErrorStore();
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = new ErrorHandler({
        id: 'my-custom-id',
      });

      // This should configure the errorHandler's dispatch function.
      createWrappedComponent({
        store,
        decorator: withErrorHandler,
        customProps: { errorHandler },
      });

      const error = new Error('some error');
      errorHandler.handle(error);

      const expectedAction = errorHandler.createErrorAction(error);
      sinon.assert.calledWith(dispatch, expectedAction);
    });

    it('configures an error handler for action dispatching', () => {
      const store = createErrorStore();
      sinon.spy(store, 'dispatch');
      const { component } = createWrappedComponent({ store });

      const { errorHandler } = component.props;
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

  describe('withRenderedErrorHandler', () => {
    it('renders a generic error above component content', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));

      const { dom, tree } = createWrappedComponent({
        store, id, decorator: withRenderedErrorHandler,
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
        store, id, decorator: withRenderedErrorHandler,
      });
      const errorList = findRenderedComponentWithType(tree, ErrorList);
      expect(errorList.props.messages).toEqual([nestedMessage]);
    });

    it('renders component content when there is no error', () => {
      const { dom, tree } = createWrappedComponent({
        decorator: withRenderedErrorHandler,
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
        store, id, decorator: withRenderedErrorHandler,
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
        store, id, decorator: withRenderedErrorHandler,
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
        store, id: 'this-handler-id', decorator: withRenderedErrorHandler,
      });
      expect(() => findRenderedComponentWithType(tree, ErrorList))
        .toThrowError(/Did not find exactly one match/);
    });

    it('passes through wrapped component properties without an error', () => {
      const { component } = createWrappedComponent({
        decorator: withRenderedErrorHandler,
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
        decorator: withRenderedErrorHandler,
        customProps: { color: 'red' },
      });
      expect(component.props.color).toEqual('red');
    });

    it('will capture and render errors in a custom error handler', () => {
      const errorHandler = new ErrorHandler({
        id: 'my-custom-id',
      });

      // Put an error in state attached to the custom handler.
      const store = createErrorStore();
      const error = createFakeApiError({
        nonFieldErrors: ['some error'],
      });
      store.dispatch(setError({ id: errorHandler.id, error }));

      const { tree } = createWrappedComponent({
        store,
        decorator: withRenderedErrorHandler,
        customProps: { errorHandler },
      });

      const errorList = findRenderedComponentWithType(tree, ErrorList);
      expect(errorList.props.messages).toEqual(['some error']);
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

    it('requires a dispatch function to handle an error', () => {
      const handler = new ErrorHandler({ id: 'some-id' });
      const error = new Error();
      expect(() => handler.handle(error))
        .toThrow(/dispatch function has not been configured/);
    });

    it('lets you create an error action', () => {
      const error = new Error();
      expect(errorHandler.createErrorAction(error))
        .toEqual(setError({ id: errorHandler.id, error }));
    });

    it('clears an error', () => {
      errorHandler.clear();
      expect(errorHandler.dispatch.called).toBeTruthy();
      expect(errorHandler.dispatch.firstCall.args[0])
        .toEqual(clearError(errorHandler.id));
    });

    it('lets you create an error clearing action', () => {
      expect(errorHandler.createClearingAction())
        .toEqual(clearError(errorHandler.id));
    });

    it('tells you if it has an error', () => {
      const handler = new ErrorHandler({ capturedError: new Error() });
      expect(handler.hasError()).toBe(true);
    });

    it('tells you if it does not have an error', () => {
      const handler = new ErrorHandler();
      expect(handler.hasError()).toBe(false);
    });

    it('lets you capture an error', () => {
      const handler = new ErrorHandler();
      const error = new Error();
      handler.captureError(error);
      expect(handler.hasError()).toBe(true);
    });

    it('lets you set a new dispatch function', () => {
      const dispatch1 = sinon.stub();
      const dispatch2 = sinon.stub();
      const handler = new ErrorHandler({
        dispatch: dispatch1,
      });
      handler.setDispatch(dispatch2);

      expect(handler.dispatch).toBe(dispatch2);
    });

    it('returns no component if it does not have an error', () => {
      const handler = new ErrorHandler();
      expect(handler.renderErrorIfPresent()).toBe(null);
    });

    it('returns a component if it has an error', () => {
      const handler = new ErrorHandler({ capturedError: new Error('error message') });
      const wrapper = shallow(<div>{handler.renderErrorIfPresent()}</div>);
      expect(handler.renderErrorIfPresent()).not.toBe(null);
      expect(wrapper.find(ErrorList)).toHaveLength(1);
    });
  });

  describe('withFixedErrorHandler', () => {
    const createFixedErrorComponent = (params = {}) => {
      return createWrappedComponent({
        decorator: withFixedErrorHandler,
        fileName: '/path/to/src/SomeComponent/index.js',
        ...params,
      });
    };

    it('throws an error when `extractId` is missing', () => {
      expect(() => {
        createFixedErrorComponent({
          extractId: null,
        });
      }).toThrow('`extractId` is required and must be a function.');
    });

    it('throws an error when `fileName` is not supplied', () => {
      expect(() => {
        createFixedErrorComponent({
          fileName: undefined,
          extractId: {},
        });
      }).toThrow('`fileName` parameter is required.');
    });

    it('throws an error when `extractId` is not a function', () => {
      expect(() => {
        createFixedErrorComponent({
          extractId: {},
        });
      }).toThrow('`extractId` is required and must be a function.');
    });

    it('creates an error handler with a fixed ID', () => {
      const { component } = createFixedErrorComponent({
        fileName: '/path/to/src/SomeComponent/index.js',
        extractId: () => 'unique-id-based-on-props',
      });
      const { errorHandler } = component.props;
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorHandler.id)
        .toEqual('src/SomeComponent/index.js-unique-id-based-on-props');
    });
  });

  describe('normalizeFileNameId', () => {
    it('returns a path relative to the project root directory', () => {
      expect(normalizeFileNameId('/path/to/src/foo/index.js'))
        .toEqual('src/foo/index.js');
    });

    it('returns the given filename if `src` is not in it', () => {
      const filename = 'tests/unit/core/utils/test_index.js';

      expect(normalizeFileNameId(filename)).toEqual(filename);
    });

    it('does not strip `src` in a given relative filename', () => {
      const filename = 'src/file.js';

      expect(normalizeFileNameId(filename)).toEqual(filename);
    });
  });
});
