/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import makeClassName from 'classnames';

import translate from 'amo/i18n/translate';
import Icon from 'amo/components/Icon';
import type { UserType } from 'amo/reducers/users';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  user: UserType,
  disabled?: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

const SignedInUserBase = (props: InternalProps) => (
  <div
    className={makeClassName('SignedInUser', {
      'SignedInUser--disabled': !!props.disabled,
    })}
  >
    <Icon name="user-fill" />
    <span className="SignedInUser-text">
      {props.i18n.sprintf(props.i18n.gettext('Signed in as %(username)s'), {
        username: props.user.name,
      })}
    </span>
  </div>
);

const SignedInUser: React.ComponentType<Props> =
  compose(translate())(SignedInUserBase);

export default SignedInUser;
