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
    log.info('Clearing last error for ', this.id);
    this.dispatch(clearError(this.id));
  }

  handle(error) {
    const info = { error, id: this.id };
    log.info('Dispatching error action', info);
    this.dispatch(setError(info));
  }
}

export function withErrorHandling({
  name, id = generateHandlerId({ name }),
} = {}) {
  return (WrappedComponent) => {
    class ErrorHandlerComponent extends React.Component {
      static propTypes = {
        error: PropTypes.object,
        dispatch: PropTypes.func,
      }

      render() {
        const { error, dispatch, ...otherProps } = this.props;

        const errorHandler = new ErrorHandler({ id, dispatch });
        const props = { ...otherProps, errorHandler };

        let errorInfo;
        if (error) {
          let errorMessages = [];
          errorMessages = error.messages.map(
            (error) => <li>{error}</li>);
          errorInfo = (
            <ul className="ErrorHandler-list">
              {errorMessages}
            </ul>
          );
        }

        return (
          <div>
            {errorInfo}
            <WrappedComponent {...props} />
          </div>
        );
      }
    }

    const mapStateToProps = (state) => {
      log.info(`Looking for errors in state with ID ${id}`);
      return { error: state.errors[id] };
    };

    const mapDispatchToProps = (dispatch) => ({ dispatch });

    return compose(
      connect(mapStateToProps, mapDispatchToProps),
    )(ErrorHandlerComponent);
  };
}
