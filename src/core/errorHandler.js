import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { clearError, setError } from 'core/actions/errors';
import log from 'core/logger';
import ErrorList from 'ui/components/ErrorList';

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

  shouldRenderNotFound() {
    return this.hasError() &&
      // 401 and 403 are for an add-on lookup is made to look like a 404 on
      // purpose. See: https://github.com/mozilla/addons-frontend/issues/3061.
      [401, 403, 404].includes(this.capturedError.responseStatusCode);
  }

  setDispatch(dispatch) {
    this.dispatch = dispatch;
  }

  createErrorAction(error) {
    return setError({ error, id: this.id });
  }

  handle(error) {
    if (!this.dispatch) {
      throw new Error('A dispatch function has not been configured');
    }
    const action = this.createErrorAction(error);
    this.dispatch(action);
  }
}

export type ErrorHandlerType = typeof ErrorHandler;

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
    throw new Error('`id` and `extractId` parameters are mutually exclusive.');
  }

  if (extractId && typeof extractId !== 'function') {
    throw new Error(
      '`extractId` must be a function taking `ownProps` as unique argument.'
    );
  }

  return (WrappedComponent) => {
    const mapStateToProps = () => {
      let defaultInstanceId;

      if (!extractId) {
        // Each component instance gets its own error handler ID.
        defaultInstanceId = id;

        if (!defaultInstanceId) {
          defaultInstanceId = generateHandlerId({ name });
          log.debug(`Generated error handler ID: ${defaultInstanceId}`);
        }
      }

      // Now that the component has been instantiated, return its state mapper
      // function.
      return (state, ownProps) => {
        if (extractId) {
          defaultInstanceId = `${name}-${extractId(ownProps)}`;
        }

        const instanceId = ownProps.errorHandler ?
          ownProps.errorHandler.id : defaultInstanceId;

        return {
          error: state.errors[instanceId],
          instanceId,
        };
      };
    };

    const mergeProps = (stateProps, dispatchProps, ownProps) => {
      const errorHandler = ownProps.errorHandler || new ErrorHandler({
        id: stateProps.instanceId,
      });
      errorHandler.setDispatch(dispatchProps.dispatch);
      if (stateProps.error) {
        errorHandler.captureError(stateProps.error);
      }

      return { ...ownProps, errorHandler };
    };

    return compose(
      connect(mapStateToProps, undefined, mergeProps),
    )(WrappedComponent);
  };
}

/*
 * This is a page level error decorator. It works like the `withErrorHandler()`
 * decorator, but aims at synchronizing both the server and client sides and
 * should be used for page level components.
 *
 * Pass the optional `extractId` function to create "per unique page" level
 * error handlers. This function takes the component's props and must returns a
 * unique value based on these props (e.g., based on the `slug`, `uniqueId`,
 * etc.).
 *
 * When this optional function is not supplied, we "fix" the error handler `id`
 * (e.g., `SomeComponentPage`) otherwise we pass the `name` suffixed by `Page`,
 * and the HOC will create the final error handler ID thanks to `extractId`.
 */
export const withPageErrorHandler = ({ name, extractId = null }) => {
  const params = {
    [extractId ? 'name' : 'id']: `${name}Page`,
    extractId,
  };

  return withErrorHandler(params);
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
      // eslint-disable-next-line react/prop-types
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

    return compose(
      withErrorHandler({ name, id }),
    )(ErrorBanner);
  };
}
