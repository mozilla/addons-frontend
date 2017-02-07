import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { clearError, setError } from 'core/actions/errors';
import log from 'core/logger';

import 'core/css/ErrorHandler.scss';

function generateHandlerId({ name = '' } = {}) {
  return `${name}-${Math.random().toString(36).substr(2, 9)}`;
}

export class ErrorHandler {
  constructor({ id, dispatch, errorContent = null }) {
    this.id = id;
    this.dispatch = dispatch;
    this.errorContent = errorContent;
  }

  clear() {
    log.debug('Clearing last error for ', this.id);
    this.dispatch(clearError(this.id));
  }

  getError() {
    return this.errorContent;
  }

  handle(error) {
    const info = { error, id: this.id };
    log.debug('Dispatching error action', info);
    this.dispatch(setError(info));
  }
}

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

    let errorContent;
    if (error) {
      errorContent = (
        <ul className="ErrorHandler-list">
          {error.messages.map((msg) => <li>{msg}</li>)}
        </ul>
      );
    }

    const errorHandler = new ErrorHandler({
      errorContent,
      id: errorHandlerId,
      dispatch,
    });
    const allProps = { ...props, errorHandler };

    if (error) {
      if (autoRenderErrors) {
        return (
          <div>
            {errorContent}
            <WrappedComponent {...allProps} />
          </div>
        );
      } else {
        log.warn(
          'Not rendering this error because autoRenderErrors is false:',
          error, 'Render it with errorHandler.getError()');
      }
    }

    return <WrappedComponent {...allProps} />;
  }
}

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
