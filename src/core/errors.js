import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { getApiResultId } from 'core/api';
import { setApiError } from 'core/actions';

import 'core/css/ErrorHandler.scss';

export function withErrorHandling({ name } = {}) {
  return (WrappedComponent) => {
    const apiResultId = getApiResultId({ prefix: name });

    class ErrorHandler extends React.Component {
      static propTypes = {
        apiError: PropTypes.object,
      }

      render() {
        const { apiError, ...otherProps } = this.props;
        const props = { apiResultId, ...otherProps };

        props.createErrorAction = (error) => {
          const info = {
            error, id: apiResultId,
          };
          console.log('Created error action', info);
          return setApiError(info);
        }

        let errorInfo;
        let errorMessages = [];
        if (apiError) {
          errorMessages = apiError.error.messages.map((error) => {
            return <li>{error}</li>;
          });
          errorInfo = (
            <ul className='ErrorHandler-list'>
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
      console.log(`Looking for API errors with ID ${apiResultId}`);
      return {
        apiError: state.api.errors[apiResultId],
      };
    };

    return compose(
      connect(mapStateToProps),
    )(ErrorHandler);

  }
}
