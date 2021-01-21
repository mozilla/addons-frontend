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

type DefaultProps = {|
  getErrorComponent?: typeof getErrorComponentDefault,
|};

type Props = {|
  ...DefaultProps,
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

export class ErrorPageBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    getErrorComponent: getErrorComponentDefault,
  };

  componentDidCatch(error: Error, info: Object) {
    const { dispatch } = this.props;

    dispatch(loadErrorPage({ error }));
    // eslint-disable-next-line amo/only-log-strings
    log.error('Caught application error:', error, info);
  }

  render(): React.Node {
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

const mapStateToProps = (state: AppState): PropsFromState => ({
  errorPage: state.errorPage,
});

const ErrorPage: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  ErrorPageBase,
);

export default ErrorPage;
