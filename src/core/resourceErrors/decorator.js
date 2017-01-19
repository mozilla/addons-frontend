import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { getReduxConnectError } from './reduxConnectErrors';


/*
 * Display resource errors such as a 404, 500, etc.
 *
 * Currently, the only way to produce a resource error is if an
 * asyncConnect callback returns one from its fetch() promise.
 */
function ResourceError(props) {
  const {
    reduxAsyncConnect,
    WrappedComponent,
    ...componentProps
  } = props;

  if (reduxAsyncConnect && reduxAsyncConnect.loadState) {
    const reduxResult = getReduxConnectError(reduxAsyncConnect.loadState);
    if (reduxResult.error) {
      // TODO: This will be prettier once we implement real error pages.
      // https://github.com/mozilla/addons-frontend/issues/1033
      return <div>{reduxResult.error}</div>;
    }
  }

  return <WrappedComponent {...componentProps} />;
}

/*
 * If a resource error occurs, render a ResourceError, otherwise render
 * the wrapped component.
 *
 * You only need to use this once in the top-level App component, like this:
 *
    import { handleResourceErrors } from 'core/resourceErrors/decorator';

    class App extends React.Component {
      render() {
        // renders the top-level App with routes and all.
      }
    }

    export default compose(
      handleResourceErrors,
    )(App);
 *
 * This is complementary to server side rendering which already renders
 * resource errors by default. This decorator handles the case where client
 * side navigation might result in the same server 404 scenario.
 */
export function handleResourceErrors(WrappedComponent) {
  const mapStateToProps = (state) => ({
    reduxAsyncConnect: state.reduxAsyncConnect,
    WrappedComponent,
  });

  return compose(
    connect(mapStateToProps),
  )(ResourceError);
}
