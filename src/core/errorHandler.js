import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { clearError, setError } from 'core/actions/errors';
import log from 'core/logger';

import 'core/css/ErrorHandler.scss';

function generateHandlerId({ name = '' } = {}) {
  return `${name}-${Math.random().toString(36).substr(2, 9)}`;
}

/*
 * Error handling utility for components.
 *
 * This is an interface that components can work with
 * to easily dispatch error actions or retrieve error
 * information from the Redux state.
 * Internally, this is complimentary to the ErrorHandlerComponent.
 */
export class ErrorHandler {
  constructor({ id, dispatch, capturedError = null }) {
    this.id = id;
    this.dispatch = dispatch;
    this.capturedError = capturedError;
  }

  clear() {
    log.debug('Clearing last error for ', this.id);
    this.dispatch(clearError(this.id));
  }

  getError() {
    if (this.capturedError) {
      return (
        <ul className="ErrorHandler-list">
          {this.capturedError.messages.map((msg) => <li>{msg}</li>)}
        </ul>
      );
    }
    return null;
  }

  handle(error) {
    const info = { error, id: this.id };
    log.debug('Dispatching error action', info);
    this.dispatch(setError(info));
  }
}

/*
 * Error handler component.
 *
 * This works with Redux state to render errors associated with
 * a specific error handler object.
 */
class ErrorHandlerComponent extends React.Component {
  static propTypes = {
    autoRenderErrors: PropTypes.boolean,
    dispatch: PropTypes.func,
    error: PropTypes.object,
    errorHandlerId: PropTypes.string,
    WrappedComponent: PropTypes.object,
  }

  static defaultProps = {
    autoRenderErrors: true,
  }

  render() {
    const {
      autoRenderErrors,
      WrappedComponent,
      errorHandlerId,
      dispatch,
      error,
      ...props
    } = this.props;

    const errorHandler = new ErrorHandler({
      capturedError: error,
      id: errorHandlerId,
      dispatch,
    });
    const allProps = { ...props, errorHandler };

    if (error) {
      if (autoRenderErrors) {
        return (
          <div>
            {errorHandler.getError()}
            <WrappedComponent {...allProps} />
          </div>
        );
      }

      log.warn(
        'Not rendering this error because autoRenderErrors is false:',
        error, 'Render it with errorHandler.getError()');
    }

    return <WrappedComponent {...allProps} />;
  }
}

/*
 * This is a decorator that gives a component the ability to handle errors.
 *
 * By default, it will render all errors at the top of the wrapped component's
 * content.
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
 *   withErrorHandling({ name: 'SomeComponent' }),
 * )(SomeComponent);
 *
 * If you specify withErrorHandling({ autoRenderErrors: false }) then you
 * have to render this.props.errorHandler.getError() yourself.
 */
export function withErrorHandling({ name, id, autoRenderErrors } = {}) {
  return (WrappedComponent) => {
    const mapStateToProps = () => {
      // Each component instance gets its own error handler ID.
      let instanceId = id;
      if (!instanceId) {
        instanceId = generateHandlerId({ name });
        log.debug(`Generated error handler ID: ${instanceId}`);
      }
      return (state) => ({
        autoRenderErrors,
        WrappedComponent,
        errorHandlerId: instanceId,
        error: state.errors[instanceId],
      });
    };

    return compose(
      connect(mapStateToProps),
    )(ErrorHandlerComponent);
  };
}
