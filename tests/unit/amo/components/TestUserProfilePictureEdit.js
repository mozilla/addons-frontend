import * as React from 'react';

import UserProfileEditPicture, {
  UserProfileEditPictureBase,
} from 'amo/components/UserProfileEditPicture';
import { getCurrentUser } from 'amo/reducers/users';
import UserAvatar from 'ui/components/UserAvatar';
import {
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  const render = ({ i18n = fakeI18n(), ...props } = {}) => {
    return shallowUntilTarget(
      <UserProfileEditPicture i18n={i18n} name="input-name" {...props} />,
      UserProfileEditPictureBase,
    );
  };

  it('renders itself', () => {
    const name = 'some-input-name';
    const root = render({ name });

    expect(root.find('.UserProfileEditPicture')).toHaveLength(1);
    expect(root.find('.UserProfileEdit--label'))
      .toHaveText('Profile photo');
    expect(root.find('.UserProfileEditPicture-file')).toHaveLength(1);
    expect(root.find('.UserProfileEditPicture-file-input'))
      .toHaveProp('name', name);
    expect(root.find('.UserProfileEditPicture-delete-button')).toHaveLength(0);
  });

  it('renders a UserAvatar component', () => {
    const root = render();

    expect(root.find(UserAvatar)).toHaveLength(1);
    expect(root.find(UserAvatar)).toHaveProp('altText', null);
  });

  it('specifies the alt text of the UserAvatar component when a user is passed', () => {
    const { state } = dispatchSignInActions();
    const user = getCurrentUser(state.users);

    const root = render({ user });

    expect(root.find(UserAvatar))
      .toHaveProp('altText', `Profile picture for ${user.name}`);
  });

  it('disables the input file and select button when there is no user', () => {
    const root = render();

    expect(root.find('.UserProfileEditPicture-file-input'))
      .toHaveProp('disabled', true);
    expect(root.find('.UserProfileEditPicture-select-button'))
      .toHaveClassName('Button--disabled');
  });

  it('enables the input file and select button when a user is supplied', () => {
    const { state } = dispatchSignInActions();
    const user = getCurrentUser(state.users);

    const root = render({ user });

    expect(root.find('.UserProfileEditPicture-file-input'))
      .toHaveProp('disabled', false);
    expect(root.find('.UserProfileEditPicture-select-button'))
      .not.toHaveClassName('Button--disabled');
  });

  it('calls the onSelect() prop when a user selects a picture file', () => {
    const { state } = dispatchSignInActions();
    const user = getCurrentUser(state.users);
    const onSelect = sinon.spy();

    const root = render({ user, onSelect });

    sinon.assert.notCalled(onSelect);

    root.find('.UserProfileEditPicture-file-input').simulate('change');

    sinon.assert.callCount(onSelect, 1);
  });

  it('renders a "delete" button when user has a picture URL', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: 'https://example.org/pp.png',
      },
    });
    const user = getCurrentUser(state.users);

    const root = render({ user });

    expect(root.find('.UserProfileEditPicture-delete-button')).toHaveLength(1);
  });

  it('does not render a "delete" button when user has no picture URL', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: null,
      },
    });
    const user = getCurrentUser(state.users);

    const root = render({ user });

    expect(root.find('.UserProfileEditPicture-delete-button')).toHaveLength(0);
  });

  it('calls the onDelete() prop when a user deletes the picture', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: 'https://example.org/pp.png',
      },
    });
    const user = getCurrentUser(state.users);
    const onDelete = sinon.spy();

    const root = render({ user, onDelete });

    sinon.assert.notCalled(onDelete);

    root.find('.UserProfileEditPicture-delete-button').simulate('click');

    sinon.assert.callCount(onDelete, 1);
  });
});
