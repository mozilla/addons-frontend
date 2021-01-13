import { shallow } from 'enzyme';
import * as React from 'react';

import { getCurrentUser } from 'amo/reducers/users';
import Icon from 'amo/components/Icon';
import UserAvatar from 'amo/components/UserAvatar';
import { dispatchSignInActions } from 'tests/unit/helpers';

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
      'src',
      'http://tofumatt.com/photo.jpg',
    );
  });

  it('renders extra classNames while rendering user avatar', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url: 'http://tofumatt.com/photo.jpg',
        picture_type: 'jpg',
      },
    });
    const user = getCurrentUser(state.users);
    const root = renderUserAvatar({ className: 'test', user });

    expect(root.find('.test')).toHaveLength(1);
  });

  it('renders an anonymous icon if the user has no photo', () => {
    const { state } = dispatchSignInActions({
      userProps: {
        // Since https://github.com/mozilla/addons-server/issues/7679, the API
        // returns `null` when the user does not have a profile picture.
        picture_url: null,
      },
    });
    const user = getCurrentUser(state.users);
    const root = renderUserAvatar({ user });

    expect(root.find('.UserAvatar').find(Icon)).toHaveProp(
      'name',
      'anonymous-user',
    );
  });

  it('renders an anonymous icon if there is no user', () => {
    const root = renderUserAvatar({ user: undefined });

    expect(root.find('.UserAvatar').find(Icon)).toHaveProp(
      'name',
      'anonymous-user',
    );
  });

  it('renders a preview image when supplied', () => {
    const preview = 'https://example.org/image.jpg';

    const root = renderUserAvatar({ preview });

    expect(root.find('.UserAvatar-image')).toHaveLength(1);
    expect(root.find('.UserAvatar-image')).toHaveProp('src', preview);
  });

  it('passes the given altText prop to the user picture or preview image', () => {
    const altText = 'some alt text';
    const preview = 'https://example.org/image.jpg';

    const root = renderUserAvatar({ altText, preview });

    expect(root.find('.UserAvatar-image')).toHaveLength(1);
    expect(root.find('.UserAvatar-image')).toHaveProp('alt', altText);
  });
});
