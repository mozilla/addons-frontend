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
  constructor({ id, dispatch }) {
    this.id = id;
    this.dispatch = dispatch;
  }

  clear() {
    log.debug('Clearing last error for ', this.id);
    this.dispatch(clearError(this.id));
  }

  handle(error) {
    const info = { error, id: this.id };
    log.debug('Dispatching error action', info);
    this.dispatch(setError(info));
  }
}

class ErrorHandlerComponent extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func,
    error: PropTypes.object,
    errorHandlerId: PropTypes.string,
    WrappedComponent: PropTypes.object,
  }

  render() {
    const {
      WrappedComponent,
      errorHandlerId,
      dispatch,
      error,
      ...props,
    } = this.props;
    const errorHandler = new ErrorHandler({ id: errorHandlerId, dispatch });
    const wrappedOutput = (
      <WrappedComponent errorHandler={errorHandler} {...props} />
    );

    if (error) {
      return (
        <div>
          <ul className="ErrorHandler-list">
            {error.messages.map((msg) => <li>{msg}</li>)}
          </ul>
          {wrappedOutput}
        </div>
      );
    }

    return wrappedOutput;
  }
}

export function withErrorHandling({ name, id } = {}) {
  return (WrappedComponent) => {
    const mapStateToProps = () => {
      // Each component instance gets its own error handler ID.
      let instanceId = id;
      if (!instanceId) {
        instanceId = generateHandlerId({ name });
        log.debug(`Generated error handler ID: ${instanceId}`);
      }
      return (state) => ({
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
