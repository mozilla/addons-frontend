import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setError } from 'core/actions/errors';
import log from 'core/logger';

import 'core/css/ErrorHandler.scss';

function getApiResultId({ prefix = '' } = {}) {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

class ErrorHandler {
  constructor({ apiResultId, dispatch }) {
    this.apiResultId = apiResultId;
    this.dispatch = dispatch;
  }

  clear() {
    log.info('Clearing last error for ', this.apiResultId);
    this.dispatch(setError({ id: this.apiResultId, error: null }));
  }

  handle(error) {
    const info = {
      error, id: this.apiResultId,
    };
    log.info('Dispatching error action', info);
    this.dispatch(setError(info));
  }
}

export function withErrorHandling({ name } = {}) {
  return (WrappedComponent) => {
    const apiResultId = getApiResultId({ prefix: name });

    class ErrorHandlerComponent extends React.Component {
      static propTypes = {
        apiError: PropTypes.object,
        dispatch: PropTypes.func,
      }

      render() {
        const { apiError, dispatch, ...otherProps } = this.props;

        const errorHandler = new ErrorHandler({
          apiResultId,
          dispatch,
        });

        const props = { ...otherProps, errorHandler };

        let errorInfo;
        let errorMessages = [];
        if (apiError) {
          errorMessages = apiError.error.messages.map(
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
      log.info(`Looking for API errors with ID ${apiResultId}`);
      return {
        apiError: state.errors[apiResultId],
      };
    };

    const mapDispatchToProps = (dispatch) => ({ dispatch });

    return compose(
      connect(mapStateToProps, mapDispatchToProps),
    )(ErrorHandlerComponent);
  };
}
