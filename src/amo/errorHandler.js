import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { oneLine } from 'common-tags';
import PropTypes from 'prop-types';

import log from 'amo/logger';
import { normalizeFileNameId } from 'amo/utils';
import ErrorList from 'amo/components/ErrorList';
import { clearError, setError, setErrorMessage } from 'amo/reducers/errors';

function generateHandlerId({ name = '' } = {}) {
  return `${name}-${Math.random().toString(36).substr(2, 9)}`;
}

/*
 * Error handling utility for components.
 *
 * This is a class that components can work with
 * to easily dispatch error actions or retrieve error
 * information from the Redux state.
 */
export class ErrorHandler {
  constructor({ id, dispatch = null, capturedError = null } = {}) {
    this.id = id;
    this.dispatch = dispatch;
    this.capturedError = capturedError;
  }

  captureError(error) {
    this.capturedError = error;
  }

  clear() {
    const action = this.createClearingAction();
    this.dispatch(action);
  }

  createClearingAction() {
    return clearError(this.id);
  }

  hasError() {
    return Boolean(this.capturedError);
  }

  renderError() {
    const { code, messages } = this.capturedError;
    return <ErrorList messages={messages} code={code} />;
  }

  renderErrorIfPresent() {
    return this.hasError() ? this.renderError() : null;
  }

  setDispatch(dispatch) {
    this.dispatch = dispatch;
  }

  createErrorAction(error) {
    return setError({ error, id: this.id });
  }

  addMessage(message) {
    this.dispatchAction(setErrorMessage({ id: this.id, message }));
  }

  handle(error) {
    const action = this.createErrorAction(error);
    this.dispatchAction(action);
  }

  dispatchAction(action) {
    if (!this.dispatch) {
      throw new Error('A dispatch function has not been configured');
    }
    this.dispatch(action);
  }
}

/*
 * This is a decorator that gives a component the ability to handle errors.
 *
 * The decorator will assign an ErrorHandler instance to the errorHandler
 * property.
 *
 * For convenience, you can use `withRenderedErrorHandler()` which renders the
 * error automatically at the beginning of the component's output.
 *
 * Example:
 *
 * class SomeComponent extends React.Component {
 *   static propTypes = {
 *     errorHandler: PropTypes.object.isRequired,
 *   }
 *   render() {
 *     const { errorHandler } = this.props;
 *     return (
 *       <div>
 *         {errorHandler.renderErrorIfPresent()}
 *         <div>some content</div>
 *       </div>
 *     );
 *   }
 * }
 *
 * export default compose(
 *   withErrorHandler({ name: 'SomeComponent' }),
 * )(SomeComponent);
 */
export function withErrorHandler({ name, id, extractId = null }) {
  if (id && extractId) {
    throw new Error('You can define either `id` or `extractId` but not both.');
  }

  if (extractId && typeof extractId !== 'function') {
    throw new Error(
      '`extractId` must be a function taking `ownProps` as unique argument.',
    );
  }

  return (WrappedComponent) => {
    const mapStateToProps = () => {
      let defaultErrorId;

      if (!extractId) {
        // Each component instance gets its own error handler ID.
        defaultErrorId = id;

        if (!defaultErrorId) {
          defaultErrorId = generateHandlerId({ name });
          log.debug(`Generated error handler ID: ${defaultErrorId}`);
        }
      }

      // Now that the component has been instantiated, return its state mapper
      // function.
      return (state, ownProps) => {
        if (extractId) {
          defaultErrorId = `${name}-${extractId(ownProps)}`;
          log.debug(oneLine`Generated error handler ID with extractId():
            ${defaultErrorId}`);
        }

        const errorId = ownProps.errorHandler
          ? ownProps.errorHandler.id
          : defaultErrorId;

        return {
          error: state.errors[errorId],
          errorId,
        };
      };
    };

    const mergeProps = (stateProps, dispatchProps, ownProps) => {
      const errorHandler =
        ownProps.errorHandler ||
        new ErrorHandler({
          id: stateProps.errorId,
        });
      errorHandler.setDispatch(dispatchProps.dispatch);
      if (stateProps.error) {
        errorHandler.captureError(stateProps.error);
      }

      return { ...ownProps, errorHandler };
    };

    return compose(connect(mapStateToProps, undefined, mergeProps))(
      WrappedComponent,
    );
  };
}

/*
 * This decorator works like the `withErrorHandler()` decorator but aims at
 * synchronizing both the server and client sides by using a fixed error
 * handler ID.
 *
 * The `fileName` parameter must be set to `__filename` in the component code.
 *
 * The `extractId` function is used to create a unique error handler per
 * rendered component. This function takes the component's props and must
 * return a unique string based on these props (e.g., based on the `slug`,
 * `uniqueId`, `page`, etc.).
 */
export const withFixedErrorHandler = ({ fileName, extractId }) => {
  if (!fileName) {
    throw new Error('`fileName` parameter is required.');
  }
  if (typeof extractId !== 'function') {
    throw new Error('`extractId` is required and must be a function.');
  }

  return withErrorHandler({ name: normalizeFileNameId(fileName), extractId });
};

/*
 * This is a decorator that automatically renders errors.
 *
 * It will render all errors at the top of the wrapped component's
 * content and it will pass an errorHandler property for the component
 * to use.
 *
 * Example:
 *
 * class SomeComponent extends React.Component {
 *   static propTypes = {
 *     // The decorator will assign an ErrorHandler instance to this.
 *     errorHandler: PropTypes.object.isRequired,
 *   }
 *   render() {
 *     // In the case of an error, the list of errors will be displayed
 *     // above this div.
 *     return <div>some content</div>;
 *   }
 * }
 *
 * export default compose(
 *   withRenderedErrorHandler({ name: 'SomeComponent' }),
 * )(SomeComponent);
 */
export function withRenderedErrorHandler({ name, id } = {}) {
  return (WrappedComponent) => {
    function ErrorBanner(props) {
      const { errorHandler } = props;

      if (errorHandler.hasError()) {
        return (
          <div>
            {errorHandler.renderError()}
            <WrappedComponent {...props} />
          </div>
        );
      }

      return <WrappedComponent {...props} />;
    }

    ErrorBanner.propTypes = {
      errorHandler: PropTypes.object.isRequired,
    };

    return compose(withErrorHandler({ name, id }))(ErrorBanner);
  };
}
