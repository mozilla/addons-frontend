/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import withUIState from 'core/withUIState';
import Button from 'ui/components/Button';
import ConfirmButton from 'ui/components/ConfirmButton';
import UserAvatar from 'ui/components/UserAvatar';
import type { UserType } from 'amo/reducers/users';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  name: string,
  onDelete: Function,
  onSelect: Function,
  preview: string | null,
  user: UserType | null,
|};

type UIStateType = {|
  hasFocus: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

const initialUIState: UIStateType = { hasFocus: false };

export class UserProfileEditPictureBase extends React.Component<InternalProps> {
  onFocus = () => {
    this.props.setUIState({ hasFocus: true });
  };

  onBlur = () => {
    this.props.setUIState({ hasFocus: false });
  };

  render() {
    const {
      i18n,
      name,
      onDelete,
      onSelect,
      preview,
      uiState,
      user,
    } = this.props;

    const altText = user
      ? i18n.sprintf(i18n.gettext('Profile picture for %(name)s'), {
          name: user.name,
        })
      : null;

    const confirmButtonClassName = 'UserProfileEditPicture-delete-button';

    return (
      <section className="UserProfileEditPicture">
        <label className="UserProfileEdit--label" htmlFor={name}>
          {i18n.gettext('Profile photo')}
        </label>

        <UserAvatar altText={altText} preview={preview} user={user} />

        <label
          className={makeClassName('UserProfileEditPicture-file', {
            'UserProfileEditPicture-file--has-focus': uiState.hasFocus,
          })}
          htmlFor={name}
        >
          <input
            accept="image/png, image/jpeg"
            className="UserProfileEditPicture-file-input"
            disabled={!user}
            name={name}
            onBlur={this.onBlur}
            onChange={onSelect}
            onFocus={this.onFocus}
            type="file"
          />
          <Button
            buttonType="action"
            className="UserProfileEditPicture-select-button"
            disabled={!user}
            noLink
            puffy
          >
            {i18n.gettext('Choose Photo…')}
          </Button>
        </label>

        {user &&
          user.picture_url && (
            <ConfirmButton
              buttonType="cancel"
              className={confirmButtonClassName}
              id={confirmButtonClassName}
              message={i18n.gettext(
                'Do you really want to delete this picture?',
              )}
              onConfirm={onDelete}
            >
              {i18n.gettext('Delete This Picture')}
            </ConfirmButton>
          )}
      </section>
    );
  }
}

const UserProfileEditPicture: React.ComponentType<Props> = compose(
  translate(),
  withUIState({
    extractId: () => '',
    fileName: __filename,
    initialState: initialUIState,
  }),
)(UserProfileEditPictureBase);

export default UserProfileEditPicture;
