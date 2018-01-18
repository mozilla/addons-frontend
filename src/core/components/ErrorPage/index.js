import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import log from 'core/logger';
import { getErrorComponent as getErrorComponentDefault } from 'core/utils';
import { loadErrorPage } from 'core/reducers/errorPage';


export class ErrorPageBase extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorPage: PropTypes.object,
    getErrorComponent: PropTypes.func,
  }

  static defaultProps = {
    errorPage: {},
    getErrorComponent: getErrorComponentDefault,
  }

  componentDidCatch(error, info) {
    const { dispatch } = this.props;
    dispatch(loadErrorPage({ error }));
    log.error('Caught application error:', error, info);
  }

  render() {
    const { children, errorPage, getErrorComponent } = this.props;

    if (errorPage.hasError) {
      const ErrorComponent = getErrorComponent(errorPage.statusCode);
      return (
        <ErrorComponent error={errorPage.error} status={errorPage.statusCode} />
      );
    }

    return children;
  }
}


export const mapStateToProps = (state) => ({
  errorPage: state.errorPage,
});

export default compose(
  connect(mapStateToProps),
)(ErrorPageBase);
