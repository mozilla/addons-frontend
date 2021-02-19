/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import log from 'amo/logger';
import { getErrorComponent as getErrorComponentDefault } from 'amo/utils/errors';
import { loadErrorPage } from 'amo/reducers/errorPage';
import type { AppState } from 'amo/store';
import type { ErrorPageState } from 'amo/reducers/errorPage';
import type { DispatchFunc } from 'amo/types/redux';

type Props = {|
  children: React.Node,
  getErrorComponent?: typeof getErrorComponentDefault,
|};

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  errorPage: ErrorPageState,
|};

export class ErrorPageBase extends React.Component<InternalProps> {
  static defaultProps: {|errorPage: {...}, getErrorComponent: (status: number | null) => any|} = {
    errorPage: {},
    getErrorComponent: getErrorComponentDefault,
  };

  componentDidCatch(error: Error, info: Object) {
    const { dispatch } = this.props;

    dispatch(loadErrorPage({ error }));
    // eslint-disable-next-line amo/only-log-strings
    log.error('Caught application error:', error, info);
  }

  render(): React$Node | React.Node {
    const { children, errorPage, getErrorComponent } = this.props;
    invariant(getErrorComponent, 'getErrorComponent() is undefined');

    if (errorPage.hasError) {
      const ErrorComponent = getErrorComponent(errorPage.statusCode);
      return (
        <ErrorComponent error={errorPage.error} status={errorPage.statusCode} />
      );
    }

    return children;
  }
}

export const mapStateToProps = (state: AppState): {|errorPage: ErrorPageState|} => ({
  errorPage: state.errorPage,
});

const ErrorPage: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  ErrorPageBase,
);

export default ErrorPage;
