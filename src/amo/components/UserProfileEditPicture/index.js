/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import UserAvatar from 'ui/components/UserAvatar';
import type { UserType } from 'amo/reducers/users';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  i18n: I18nType,
  name: string,
  onDelete: Function,
  onSelect: Function,
  preview: string | null,
  user: UserType | null,
|};

export const UserProfileEditPictureBase = ({
  i18n,
  name,
  onDelete,
  onSelect,
  preview,
  user,
}: Props) => {
  const altText = user ? i18n.sprintf(
    i18n.gettext('Profile picture for %(name)s'), { name: user.name }
  ) : null;

  return (
    <section className="UserProfileEdit-picture">
      <label className="UserProfileEdit--label" htmlFor={name}>
        {i18n.gettext('Profile photo')}
      </label>

      <UserAvatar
        altText={altText}
        preview={preview}
        user={user}
      />

      {/* eslint-disable-next-line jsx-a11y/label-has-for */}
      <label className="FileInput">
        <input
          className="FileInput-input"
          disabled={!user}
          name={name}
          onChange={onSelect}
          type="file"
        />
        <span className="Button Button--action Button--puffy">
          {i18n.gettext('Choose photo...')}
        </span>
      </label>

      {(user && user.picture_url) && (
        <Button onClick={onDelete}>
          {i18n.gettext('Delete this picture')}
        </Button>
      )}
    </section>
  );
};

export default compose(
  translate(),
)(UserProfileEditPictureBase);
