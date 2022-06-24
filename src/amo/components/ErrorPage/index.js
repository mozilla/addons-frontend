/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import log from 'amo/logger';
import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';
import { loadErrorPage } from 'amo/reducers/errorPage';
import type { AppState } from 'amo/store';
import type { ErrorPageState } from 'amo/reducers/errorPage';
import type { DispatchFunc } from 'amo/types/redux';

type Props = {|
  children: React.Node,
|};

type PropsFromState = {|
  errorPage: ErrorPageState,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
|};

export const getErrorComponent = (
  status: number | null,
): (() => React.Node) => {
  switch (status) {
    case 401:
      return NotAuthorizedPage;
    case 404:
      return NotFoundPage;
    case 500:
    default:
      return ServerErrorPage;
  }
};

export class ErrorPageBase extends React.Component<InternalProps> {
  componentDidCatch(error: Error, info: Object) {
    const { dispatch } = this.props;

    dispatch(loadErrorPage({ error }));
    // eslint-disable-next-line amo/only-log-strings
    log.error('Caught application error:', error, info);
  }

  render(): React.Node {
    const { children, errorPage } = this.props;

    if (errorPage.hasError) {
      const ErrorComponent = getErrorComponent(errorPage.statusCode);
      return <ErrorComponent />;
    }

    return children;
  }
}

const mapStateToProps = (state: AppState): PropsFromState => ({
  errorPage: state.errorPage,
});

const ErrorPage: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  ErrorPageBase,
);

export default ErrorPage;
