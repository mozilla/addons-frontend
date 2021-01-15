import * as React from 'react';

import UserProfileEditPicture, {
  UserProfileEditPictureBase,
} from 'amo/components/UserProfileEditPicture';
import { getCurrentUser } from 'amo/reducers/users';
import ConfirmButton from 'ui/components/ConfirmButton';
import UserAvatar from 'ui/components/UserAvatar';
import {
  applyUIStateChanges,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    i18n = fakeI18n(),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <UserProfileEditPicture
        i18n={i18n}
        name="input-name"
        onDelete={sinon.stub()}
        onSelect={sinon.stub()}
        preview={null}
        store={store}
        user={null}
        {...props}
      />,
      UserProfileEditPictureBase,
    );
  };

  it('renders without a user', () => {
    const name = 'some-input-name';
    const root = render({ name, user: null });

    expect(root.find('.UserProfileEditPicture')).toHaveLength(1);
    expect(root.find('.UserProfileEdit--label')).toHaveText('Profile photo');
    expect(root.find('.UserProfileEditPicture-file')).toHaveLength(1);
    expect(root.find('.UserProfileEditPicture-file-input')).toHaveProp(
      'name',
      name,
    );
    expect(root.find('.UserProfileEditPicture-file-input')).toHaveProp(
      'accept',
      'image/png, image/jpeg',
    );
    expect(root.find('.UserProfileEditPicture-delete-button')).toHaveLength(0);
  });

  it('renders a UserAvatar component without a user', () => {
    const root = render({ user: null });

    expect(root.find(UserAvatar)).toHaveLength(1);
    expect(root.find(UserAvatar)).toHaveProp('altText', null);
  });

  it('specifies the alt text of the UserAvatar component when a user is passed', () => {
    const { state } = dispatchSignInActions();
    const user = getCurrentUser(state.users);
    const preview = 'a-preview-image';

    const root = render({ preview, user });

    const userAvatar = root.find(UserAvatar);

    expect(userAvatar).toHaveLength(1);
    expect(userAvatar).toHaveProp(
      'altText',
      `Profile picture for ${user.name}`,
    );
    expect(userAvatar).toHaveProp('preview', preview);
    expect(userAvatar).toHaveProp('user', user);
  });

  it('disables the input file and select button when there is no user', () => {
    const root = render();

    expect(root.find('.UserProfileEditPicture-file-input')).toHaveProp(
      'disabled',
      true,
    );
    expect(root.find('.UserProfileEditPicture-select-button')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('enables the input file and select button when a user is supplied', () => {
    const { state } = dispatchSignInActions();
    const user = getCurrentUser(state.users);

    const root = render({ user });

    expect(root.find('.UserProfileEditPicture-file-input')).toHaveProp(
      'disabled',
      false,
    );
    expect(
      root.find('.UserProfileEditPicture-select-button'),
    ).not.toHaveClassName('Button--disabled');
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

  it('renders a "delete" ConfirmButton when user has a picture URL', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: 'https://example.org/pp.png',
      },
    });
    const user = getCurrentUser(state.users);
    const onDelete = sinon.stub();

    const root = render({ user, onDelete });

    expect(root.find(ConfirmButton)).toHaveLength(1);
    expect(root.find(ConfirmButton)).toHaveClassName(
      'UserProfileEditPicture-delete-button',
    );
    expect(root.find(ConfirmButton)).toHaveProp(
      'message',
      'Do you really want to delete this picture?',
    );
    expect(root.find(ConfirmButton)).toHaveProp('onConfirm', onDelete);
    expect(root.find(ConfirmButton).children()).toHaveText(
      'Delete This Picture',
    );
    // By default, a `ConfirmButton` (or even a `Button`) has type "submit" but
    // we don't want that for this button as the `UserProfileEditPicture`
    // component is meant to be rendered within the `UserProfileEdit` form.
    // The first button with type "submit" in the form is triggered when we
    // submit the form by pressing `enter`, and if this component had a button
    // with type "submit", it would be the first one in the form, which is not
    // what we want!
    // See: https://github.com/mozilla/addons-frontend/issues/9493
    expect(root.find(ConfirmButton)).toHaveProp('htmlType', 'button');
  });

  it('does not render a "delete" ConfirmButton when user has no picture URL', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: null,
      },
    });
    const user = getCurrentUser(state.users);

    const root = render({ user });

    expect(root.find(ConfirmButton)).toHaveLength(0);
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

    // We assume the user confirms picture deletion.
    const onConfirm = root.find(ConfirmButton).prop('onConfirm');
    onConfirm();

    sinon.assert.callCount(onDelete, 1);
  });

  it('adds a CSS class when file input has focus', () => {
    const { store, state } = dispatchSignInActions();
    const user = getCurrentUser(state.users);

    const root = render({ user, store });

    expect(root.find('.UserProfileEditPicture-file')).not.toHaveClassName(
      'UserProfileEditPicture-file--has-focus',
    );

    root.find('input').simulate('focus');
    applyUIStateChanges({ root, store });

    expect(root.find('.UserProfileEditPicture-file')).toHaveClassName(
      'UserProfileEditPicture-file--has-focus',
    );
  });

  it('removes a CSS class when file input looses focus', () => {
    const { store, state } = dispatchSignInActions();
    const user = getCurrentUser(state.users);

    const root = render({ user, store });

    root.find('input').simulate('focus');
    applyUIStateChanges({ root, store });

    expect(root.find('.UserProfileEditPicture-file')).toHaveClassName(
      'UserProfileEditPicture-file--has-focus',
    );

    root.find('input').simulate('blur');
    applyUIStateChanges({ root, store });

    expect(root.find('.UserProfileEditPicture-file')).not.toHaveClassName(
      'UserProfileEditPicture-file--has-focus',
    );
  });
});
