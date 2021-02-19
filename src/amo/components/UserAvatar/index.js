/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'amo/components/Icon';
import type { UserType } from 'amo/reducers/users';

type Props = {|
  altText?: string | null,
  className?: string,
  preview?: string | null,
  user: UserType | null,
|};

const UserAvatar = ({
  altText,
  className,
  preview,
  user,
}: Props): React.Element<'div'> => {
  const _className = makeClassName('UserAvatar', className);

  let image = preview && preview.length ? preview : null;

  if (user && !image) {
    image = user.picture_url ? user.picture_url : null;
  }

  return (
    <div className={_className}>
      {image ? (
        <img alt={altText} className="UserAvatar-image" src={image} />
      ) : (
        <Icon name="anonymous-user" />
      )}
    </div>
  );
};

export default UserAvatar;
