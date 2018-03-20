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

  return (
    <div className={_className}>
      {
        (user && user.picture_type && user.picture_type.length) ?
          <img alt="" src={user.picture_url} /> :
          <Icon name="anonymous-user" />
      }
    </div>
  );
};

export default UserAvatar;
