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
    error: PropTypes.object,
    // This property gets passed to the wrapper.
    errorHandler: PropTypes.object,
    WrappedComponent: PropTypes.object,
  }

  render() {
    const { WrappedComponent, error, ...props } = this.props;
    const wrappedOutput = <WrappedComponent {...props} />;

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

export function withErrorHandling({
  name, id = generateHandlerId({ name }),
} = {}) {
  return (WrappedComponent) => {
    const mapStateToProps = (state) => {
      log.debug(`Looking for errors in state with ID ${id}`);
      return { error: state.errors[id] };
    };

    const mapDispatchToProps = (dispatch) => ({
      WrappedComponent,
      errorHandler: new ErrorHandler({ id, dispatch }),
    });

    return compose(
      connect(mapStateToProps, mapDispatchToProps),
    )(ErrorHandlerComponent);
  };
}
