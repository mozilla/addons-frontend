import { shallow } from 'enzyme';
import * as React from 'react';

import { getCurrentUser } from 'amo/reducers/users';
import Icon from 'ui/components/Icon';
import UserAvatar from 'ui/components/UserAvatar';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  function renderUserAvatar({ ...props } = {}) {
    return shallow(<UserAvatar {...props} />);
  }

  it('renders user avatar', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: 'http://tofumatt.com/photo.jpg',
        picture_type: 'jpg',
      },
    });
    const user = getCurrentUser(state.users);
    const root = renderUserAvatar({ user });

    expect(root.find('.UserAvatar-image')).toHaveLength(1);
    expect(root.find('.UserAvatar-image')).toHaveProp(
      'src', 'http://tofumatt.com/photo.jpg');
  });

  it('renders an anonymous icon if the user has no photo', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: 'anonymous.jpg',
        // An empty picture type means no avatar.
        // See: https://github.com/mozilla/addons-server/issues/7679
        picture_type: '',
      },
    });
    const user = getCurrentUser(state.users);
    const root = renderUserAvatar({ user });

    expect(root.find('.UserAvatar').find(Icon))
      .toHaveProp('name', 'anonymous-user');
  });

  it('renders an anonymous icon if there is no user', () => {
    const root = renderUserAvatar({ user: undefined });

    expect(root.find('.UserAvatar').find(Icon))
      .toHaveProp('name', 'anonymous-user');
  });
});
