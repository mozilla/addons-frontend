import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getErrorComponent } from 'amo/utils';


export class ErrorPageBase extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    errorPage: PropTypes.object.isRequired,
  }

  static defaultProps = {
    errorPage: {},
  }

  render() {
    const { children, errorPage } = this.props;

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
