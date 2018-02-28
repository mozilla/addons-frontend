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
      id: 599,
      picture_url: 'http://tofumatt.com/photo.jpg',
      picture_type: 'jpg',
    });
    const user = getCurrentUser(state.users);
    const root = renderUserAvatar({ user });

    expect(root.find('img.UserAvatar')).toHaveLength(1);
    expect(root.find('.UserAvatar')).toHaveProp(
      'src', 'http://tofumatt.com/photo.jpg');
  });

  it('renders extra classNames when rendering an <img> tag', () => {
    const { state } = dispatchSignInActions({
      id: 599,
      picture_url: 'http://tofumatt.com/photo.jpg',
      picture_type: 'jpg',
    });
    const user = getCurrentUser(state.users);
    const root = renderUserAvatar({ className: 'test', user });

    expect(root.find('img.test')).toHaveLength(1);
  });

  it('renders extra classNames when rendering an Icon component', () => {
    const root = renderUserAvatar({ className: 'test', user: null });

    expect(root.find(Icon).find('.test')).toHaveLength(1);
  });

  it('renders an anonymous icon if the user has no photo', () => {
    const { state } = dispatchSignInActions({
      id: 599,
      picture_url: 'anonymous.jpg',
      // An empty picture type means no avatar.
      picture_type: '',
    });
    const user = getCurrentUser(state.users);
    const root = renderUserAvatar({ user });

    expect(root.find(Icon).find('.UserAvatar'))
      .toHaveProp('name', 'anonymous-user');
  });

  it('renders an anonymous icon if there is no user', () => {
    const root = renderUserAvatar({ user: null });

    expect(root.find(Icon).find('.UserAvatar'))
      .toHaveProp('name', 'anonymous-user');
  });
});
