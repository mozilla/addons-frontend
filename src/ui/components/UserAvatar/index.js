/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'ui/components/Icon';
import type { UserType } from 'amo/reducers/users';


type Props = {|
  className?: string,
  user?: UserType,
|};

const UserAvatar = ({ className, user }: Props) => {
  const _className = makeClassName('UserAvatar', className);

  return (user && user.picture_type && user.picture_type.length ?
    <img alt="" className={_className} src={user.picture_url} /> :
    <Icon className={_className} name="anonymous-user" />
  );
};

export default UserAvatar;
