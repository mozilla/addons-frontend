import * as React from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { shallow } from 'enzyme';

import { createApiError } from 'amo/api/index';
import { ERROR_UNKNOWN } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { clearError, setError, setErrorMessage } from 'amo/actions/errors';
import {
  ErrorHandler,
  withErrorHandler,
  withFixedErrorHandler,
  withRenderedErrorHandler,
} from 'amo/errorHandler';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { createFakeApiError } from 'tests/unit/amo/reducers/test_errors';
import ErrorList from 'ui/components/ErrorList';

class SomeComponentBase extends React.Component {
  static propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
    errorHandler: PropTypes.object,
  };

  render() {
    return <div className="SomeComponent">Component text</div>;
  }
}

function createErrorStore() {
  return dispatchClientMetadata().store;
}

function renderWithStore({
  id,
  store = createErrorStore(),
  decorator = withErrorHandler,
  customProps = {},
  ShallowTarget = SomeComponentBase,
  ...options
} = {}) {
  const ComponentWithErrorHandling = compose(
    translate(),
    decorator({
      id,
      name: 'SomeComponent',
      ...options,
    }),
  )(SomeComponentBase);

  const props = {
    i18n: fakeI18n(),
    store,
    ...customProps,
  };

  return shallowUntilTarget(
    <ComponentWithErrorHandling {...props} />,
    ShallowTarget,
  );
}

describe(__filename, () => {
  describe('withErrorHandler', () => {
    it('provides a unique errorHandler property', () => {
      const root = renderWithStore();

      const { errorHandler } = root.instance().props;
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorHandler.id).toMatch(/^SomeComponent-/);
    });

    it('throws an error if both `id` and `extractId` parameters are given', () => {
      expect(() => {
        renderWithStore({
          id: 'error-handler-id',
          extractId: () => 'unique-id',
        });
      }).toThrow('You can define either `id` or `extractId` but not both.');
    });

    it('throws an error if `extractId` is not a function', () => {
      expect(() => {
        renderWithStore({
          extractId: 'invalid type',
        });
      }).toThrow(
        '`extractId` must be a function taking `ownProps` as unique argument.',
      );
    });

    it('creates an error handler ID with `extractId`', () => {
      const root = renderWithStore({
        // Passed to the wrapped component.
        customProps: {
          propWithUniqueValue: '1234',
        },
        // Passed to the error handler HOC.
        extractId: (ownProps) => ownProps.propWithUniqueValue,
      });

      expect(root.instance().props.errorHandler.id).toEqual(
        'SomeComponent-1234',
      );
    });

    it('creates a unique handler ID per wrapped component', () => {
      const component1 = renderWithStore();
      const component2 = renderWithStore();

      expect(component1.instance().props.errorHandler.id).not.toEqual(
        component2.instance().props.errorHandler.id,
      );
    });

    it('creates a unique handler ID per component instance', () => {
      const SomeComponent = translate()(SomeComponentBase);
      const ComponentWithErrorHandling = withErrorHandler({
        name: 'SomeComponent',
      })(SomeComponent);

      const getRenderedComponent = () => {
        return shallowUntilTarget(
          <ComponentWithErrorHandling store={createErrorStore()} />,
          SomeComponent,
        );
      };

      const component1 = getRenderedComponent();
      const component2 = getRenderedComponent();

      expect(component1.instance().props.errorHandler.id).not.toEqual(
        component2.instance().props.errorHandler.id,
      );
    });

    it('allows you to set a custom error handler', () => {
      const errorHandler = new ErrorHandler({
        id: 'my-custom-id',
      });
      const root = renderWithStore({
        customProps: { errorHandler },
      });

      expect(root.instance().props.errorHandler).toBe(errorHandler);
      expect(root.instance().props.errorHandler.id).toEqual('my-custom-id');
    });

    it('adjusts the dispatch property of a custom error handler', () => {
      const store = createErrorStore();
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = new ErrorHandler({
        id: 'my-custom-id',
      });

      // This should configure the errorHandler's dispatch function.
      renderWithStore({
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
      const root = renderWithStore({ store });

      const { errorHandler } = root.instance().props;
      const error = new Error();
      errorHandler.handle(error);

      sinon.assert.calledWith(
        store.dispatch,
        setError({ id: errorHandler.id, error }),
      );
    });

    it('passes through wrapped component properties', () => {
      const root = renderWithStore({
        customProps: { color: 'red' },
      });

      expect(root.instance().props.color).toEqual('red');
    });
  });

  describe('withRenderedErrorHandler', () => {
    const renderWithRenderedErrorHandler = (props = {}) => {
      return renderWithStore({
        ShallowTarget: 'ErrorBanner',
        decorator: withRenderedErrorHandler,
        ...props,
      });
    };

    it('renders a generic error above component content', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));

      const root = renderWithRenderedErrorHandler({ store, id });

      const errorList = root.find(ErrorList);
      expect(errorList).toHaveProp('code', ERROR_UNKNOWN);
      expect(errorList).toHaveProp('messages', []);

      // It also renders the wrapped component.
      expect(root.find(SomeComponentBase)).toHaveLength(1);
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

      const root = renderWithRenderedErrorHandler({ store, id });

      const errorList = root.find(ErrorList);
      expect(errorList).toHaveProp('messages', [nestedMessage]);
    });

    it('renders component content when there is no error', () => {
      const root = renderWithRenderedErrorHandler();

      expect(root.find(ErrorList)).toHaveLength(0);
      expect(root.find(SomeComponentBase)).toHaveLength(1);
    });

    it('renders multiple error messages', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      const error = createFakeApiError({
        nonFieldErrors: ['first error', 'second error'],
      });
      store.dispatch(setError({ id, error }));

      const root = renderWithRenderedErrorHandler({ store, id });

      expect(root.find(ErrorList)).toHaveLength(1);
      expect(root.find(ErrorList)).toHaveProp('messages', [
        'first error',
        'second error',
      ]);
    });

    it('erases cleared errors', () => {
      const id = 'some-handler-id';

      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));
      store.dispatch(clearError(id));

      const root = renderWithRenderedErrorHandler({ store, id });

      expect(root.find(ErrorList)).toHaveLength(0);
    });

    it('ignores errors sent by other error handlers', () => {
      const store = createErrorStore();
      store.dispatch(
        setError({
          id: 'another-handler-id',
          error: new Error(),
        }),
      );

      const root = renderWithStore({ store, id: 'this-handler-id' });

      expect(root.find(ErrorList)).toHaveLength(0);
    });

    it('passes through wrapped component properties without an error', () => {
      const root = renderWithRenderedErrorHandler({
        customProps: { color: 'red' },
      });

      expect(root.find(SomeComponentBase)).toHaveProp('color', 'red');
    });

    it('passes through wrapped component properties with an error', () => {
      const id = 'some-id';
      const store = createErrorStore();
      store.dispatch(setError({ id, error: new Error() }));

      const root = renderWithRenderedErrorHandler({
        id,
        store,
        customProps: { color: 'red' },
      });

      expect(root.find(SomeComponentBase)).toHaveProp('color', 'red');
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

      const root = renderWithRenderedErrorHandler({
        store,
        customProps: { errorHandler },
      });

      expect(root.find(ErrorList)).toHaveProp('messages', ['some error']);
    });
  });

  describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
      errorHandler = new ErrorHandler({
        id: 'some-handler',
        dispatch: sinon.stub(),
      });
    });

    it('dispatches an error', () => {
      const error = new Error();
      errorHandler.handle(error);
      sinon.assert.calledWith(
        errorHandler.dispatch,
        setError({ id: errorHandler.id, error }),
      );
    });

    it('requires a dispatch function to handle an error', () => {
      const handler = new ErrorHandler({ id: 'some-id' });
      const error = new Error();
      expect(() => handler.handle(error)).toThrow(
        /dispatch function has not been configured/,
      );
    });

    it('requires a dispatch function to add a message', () => {
      const handler = new ErrorHandler({ id: 'some-id' });
      expect(() => handler.addMessage('some message')).toThrow(
        /dispatch function has not been configured/,
      );
    });

    it('dispatches a message', () => {
      const message = 'Name field cannot be blank';
      errorHandler.addMessage(message);
      sinon.assert.calledWith(
        errorHandler.dispatch,
        setErrorMessage({ id: errorHandler.id, message }),
      );
    });

    it('lets you create an error action', () => {
      const error = new Error();
      expect(errorHandler.createErrorAction(error)).toEqual(
        setError({ id: errorHandler.id, error }),
      );
    });

    it('clears an error', () => {
      errorHandler.clear();
      sinon.assert.calledWith(
        errorHandler.dispatch,
        clearError(errorHandler.id),
      );
    });

    it('lets you create an error clearing action', () => {
      expect(errorHandler.createClearingAction()).toEqual(
        clearError(errorHandler.id),
      );
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
      const handler = new ErrorHandler({
        capturedError: new Error('error message'),
      });
      const wrapper = shallow(<div>{handler.renderErrorIfPresent()}</div>);
      expect(handler.renderErrorIfPresent()).not.toBe(null);
      expect(wrapper.find(ErrorList)).toHaveLength(1);
    });
  });

  describe('withFixedErrorHandler', () => {
    const renderWithFixedErrorHandler = (params = {}) => {
      return renderWithStore({
        decorator: withFixedErrorHandler,
        fileName: '/path/to/src/SomeComponent/index.js',
        ...params,
      });
    };

    it('throws an error when `extractId` is missing', () => {
      expect(() => {
        renderWithFixedErrorHandler({
          extractId: null,
        });
      }).toThrow('`extractId` is required and must be a function.');
    });

    it('throws an error when `fileName` is not supplied', () => {
      expect(() => {
        renderWithFixedErrorHandler({
          fileName: undefined,
          extractId: {},
        });
      }).toThrow('`fileName` parameter is required.');
    });

    it('throws an error when `extractId` is not a function', () => {
      expect(() => {
        renderWithFixedErrorHandler({
          extractId: {},
        });
      }).toThrow('`extractId` is required and must be a function.');
    });

    it('creates an error handler with a fixed ID', () => {
      const root = renderWithFixedErrorHandler({
        fileName: '/path/to/src/SomeComponent/index.js',
        extractId: () => 'unique-id-based-on-props',
      });

      const { errorHandler } = root.instance().props;
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorHandler.id).toEqual(
        'src/SomeComponent/index.js-unique-id-based-on-props',
      );
    });
  });
});
