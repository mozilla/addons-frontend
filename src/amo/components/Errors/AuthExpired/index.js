/* @flow */
/* global window */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import type { I18nType } from 'amo/types/i18n';
import { logOutUser as logOutUserAction } from 'amo/reducers/users';
import type { DispatchFunc } from 'amo/types/redux';

type Props = {||};

type DefaultProps = {|
  _window: typeof window,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  i18n: I18nType,
  dispatch: DispatchFunc,
|};

export class AuthExpiredBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(logOutUserAction());
  }

  render(): React.Node {
    const { _window, i18n } = this.props;

    const reloadButton = (
      <Button
        buttonType="action"
        micro
        onClick={() => _window.location.reload()}
      >
        {i18n.gettext('Reload the page')}
      </Button>
    );

    return (
      <ErrorComponent code={401} header={i18n.gettext('Login Expired')}>
        <p>
          {i18n.gettext(`Login authentication has expired.`)}
          {reloadButton}
          {i18n.gettext(`
            to continue without authentication, or login again using the Log In
            link at the top of the page.`)}
        </p>
      </ErrorComponent>
    );
  }
}

const AuthExpired: React.ComponentType<Props> = compose(
  connect(),
  translate(),
)(AuthExpiredBase);

export default AuthExpired;
