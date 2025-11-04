import * as React from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import userEvent from '@testing-library/user-event';

import { createFakeApiError } from 'tests/unit/amo/reducers/test_errors';
import { createApiError } from 'amo/api/index';
import translate from 'amo/i18n/translate';
import {
  ErrorHandler,
  withErrorHandler,
  withFixedErrorHandler,
  withRenderedErrorHandler,
} from 'amo/errorHandler';
import { clearError, setError, setErrorMessage } from 'amo/reducers/errors';
import {
  createCapturedErrorHandler,
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

class SomeComponentBase extends React.Component {
  static propTypes = {
    color: PropTypes.string,
    // eslint-disable-next-line react/no-unused-prop-types
    errorHandler: PropTypes.object,
  };

  handleError = () => {
    this.props.errorHandler.handle(new Error());
  };

  render() {
    return (
      <div className="SomeComponent">
        <input
          name="inputName"
          onClick={this.handleError}
          readOnly
          value={this.props.errorHandler.id}
        />
        <div>color: {this.props.color}</div>
      </div>
    );
  }
}

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({
    id,
    decorator = withErrorHandler,
    customProps = {},
    ...options
  } = {}) => {
    const ComponentWithErrorHandling = compose(
      translate(),
      decorator({
        id,
        name: 'SomeComponent',
        ...options,
      }),
    )(SomeComponentBase);

    return defaultRender(<ComponentWithErrorHandling {...customProps} />, {
      store,
    });
  };

  const getInput = () => screen.getByRole('textbox');

  describe('withErrorHandler', () => {
    it('provides a unique errorHandler property', () => {
      const id = 'Some-unique-id';
      render({ id });

      // The id assigned to the errorHandler is the value of the input.
      expect(getInput()).toHaveValue(id);
    });

    it('throws an error if both `id` and `extractId` parameters are given', () => {
      expect(() => {
        render({
          id: 'error-handler-id',
          extractId: () => 'unique-id',
        });
      }).toThrow('You can define either `id` or `extractId` but not both.');
    });

    it('throws an error if `extractId` is not a function', () => {
      expect(() => {
        render({
          extractId: 'invalid type',
        });
      }).toThrow(
        '`extractId` must be a function taking `ownProps` as unique argument.',
      );
    });

    it('creates an error handler ID with `extractId`', () => {
      render({
        // Passed to the wrapped component.
        customProps: {
          propWithUniqueValue: '1234',
        },
        // Passed to the error handler HOC.
        extractId: (ownProps) => ownProps.propWithUniqueValue,
      });

      expect(getInput()).toHaveValue('SomeComponent-1234');
    });

    it('creates a unique handler ID per wrapped component', () => {
      render();
      render();

      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0].value).not.toEqual(inputs[1].value);
    });

    it('creates a unique handler ID per component instance', () => {
      const SomeComponent = translate()(SomeComponentBase);
      const ComponentWithErrorHandling = withErrorHandler({
        name: 'SomeComponent',
      })(SomeComponent);

      const getRenderedComponent = () => {
        render(<ComponentWithErrorHandling />);
      };

      getRenderedComponent();
      getRenderedComponent();

      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0].value).not.toEqual(inputs[1].value);
    });

    it('allows you to set a custom error handler', () => {
      const id = 'my-custom-id';
      const errorHandler = new ErrorHandler({ id });
      render({ customProps: { errorHandler } });

      expect(getInput()).toHaveValue(id);
    });

    it('adjusts the dispatch property of a custom error handler', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const errorHandler = new ErrorHandler({
        id: 'my-custom-id',
      });

      // This should configure the errorHandler's dispatch function.
      render({
        decorator: withErrorHandler,
        customProps: { errorHandler },
      });

      const error = new Error('some error');
      errorHandler.handle(error);

      const expectedAction = errorHandler.createErrorAction(error);
      expect(dispatch).toHaveBeenCalledWith(expectedAction);
    });

    it('configures an error handler for action dispatching', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      await userEvent.click(getInput());

      expect(dispatch).toHaveBeenCalledWith(
        setError({
          id: expect.stringContaining('SomeComponent-'),
          error: new Error(),
        }),
      );
    });

    it('passes through wrapped component properties', () => {
      const color = 'red';
      render({ customProps: { color } });

      expect(screen.getByText(`color: ${color}`)).toBeInTheDocument();
    });
  });

  describe('withRenderedErrorHandler', () => {
    const renderWithRenderedErrorHandler = (props = {}) => {
      return render({
        ShallowTarget: 'ErrorBanner',
        decorator: withRenderedErrorHandler,
        ...props,
      });
    };

    it('renders a generic error above component content', () => {
      const id = 'some-handler-id';
      store.dispatch(setError({ id, error: new Error() }));

      renderWithRenderedErrorHandler({ id });

      // The rendered ErrorList will be in a `list`.
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred'),
      ).toBeInTheDocument();

      // It also renders the wrapped component.
      expect(getInput()).toHaveValue(id);
    });

    it('passes a nested API response object', () => {
      const id = 'some-handler-id';

      // This is a possible but unlikely API response. Make sure
      // it gets passed to ErrorList correctly.
      const nestedMessage = { nested: { message: 'end' } };
      const error = createApiError({
        response: { status: 401 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: nestedMessage },
      });
      store.dispatch(setError({ id, error }));

      renderWithRenderedErrorHandler({ id });

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(
        screen.getByText('{"nested":{"message":"end"}}'),
      ).toBeInTheDocument();
    });

    it('renders component content when there is no error', () => {
      renderWithRenderedErrorHandler();

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(getInput()).toBeInTheDocument();
    });

    it('renders multiple error messages', () => {
      const id = 'some-handler-id';
      const firstError = 'first error';
      const secondError = 'second error';

      const error = createFakeApiError({
        nonFieldErrors: [firstError, secondError],
      });
      store.dispatch(setError({ id, error }));

      renderWithRenderedErrorHandler({ id });

      expect(screen.getByText(firstError)).toBeInTheDocument();
      expect(screen.getByText(secondError)).toBeInTheDocument();
    });

    it('erases cleared errors', () => {
      const id = 'some-handler-id';

      store.dispatch(setError({ id, error: new Error() }));
      store.dispatch(clearError(id));

      renderWithRenderedErrorHandler({ id });

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('ignores errors sent by other error handlers', () => {
      store.dispatch(
        setError({
          id: 'another-handler-id',
          error: new Error(),
        }),
      );

      render({ id: 'this-handler-id' });

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('passes through wrapped component properties without an error', () => {
      const color = 'red';
      renderWithRenderedErrorHandler({ customProps: { color } });

      expect(screen.getByText(`color: ${color}`)).toBeInTheDocument();
    });

    it('passes through wrapped component properties with an error', () => {
      const color = 'red';
      const id = 'some-id';
      store.dispatch(setError({ id, error: new Error() }));

      renderWithRenderedErrorHandler({ customProps: { color } });

      expect(screen.getByText(`color: ${color}`)).toBeInTheDocument();
    });

    it('will capture and render errors in a custom error handler', () => {
      const errorHandler = new ErrorHandler({
        id: 'my-custom-id',
      });

      // Put an error in state attached to the custom handler.
      const errorMessage = 'Some error message';
      const error = createFakeApiError({
        nonFieldErrors: [errorMessage],
      });
      store.dispatch(setError({ id: errorHandler.id, error }));

      renderWithRenderedErrorHandler({ customProps: { errorHandler } });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
      errorHandler = new ErrorHandler({
        id: 'some-handler',
        dispatch: jest.fn(),
      });
    });

    it('dispatches an error', () => {
      const error = new Error();
      errorHandler.handle(error);
      expect(errorHandler.dispatch).toHaveBeenCalledWith(
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
      expect(errorHandler.dispatch).toHaveBeenCalledWith(
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
      expect(errorHandler.dispatch).toHaveBeenCalledWith(
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
      const dispatch1 = jest.fn();
      const dispatch2 = jest.fn();
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
      const handler = createCapturedErrorHandler({ store });
      defaultRender(<div>{handler.renderErrorIfPresent()}</div>);
      expect(handler.renderErrorIfPresent()).not.toBe(null);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('withFixedErrorHandler', () => {
    const renderWithFixedErrorHandler = (params = {}) => {
      return render({
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
      renderWithFixedErrorHandler({
        fileName: '/path/to/src/SomeComponent/index.js',
        extractId: () => 'unique-id-based-on-props',
      });

      expect(getInput()).toHaveValue(
        'src/SomeComponent/index.js-unique-id-based-on-props',
      );
    });
  });
});
