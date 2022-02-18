import * as React from 'react';

import UserAvatar from 'amo/components/UserAvatar';
import { getCurrentUser } from 'amo/reducers/users';
import {
  dispatchSignInActions,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ ...props } = {}) {
    return defaultRender(<UserAvatar {...props} />);
  }

  const getUser = ({
    picture_url = 'http://tofumatt.com/photo.jpg',
    picture_type = 'jpg',
  }) => {
    const { state } = dispatchSignInActions({
      userProps: {
        picture_url,
        picture_type,
      },
    });
    return getCurrentUser(state.users);
  };

  it('renders user avatar', () => {
    const user = getUser({ picture_url: 'http://tofumatt.com/photo.jpg' });
    render({ user });

    const img = screen.getByTagName('img');
    expect(img).toHaveClass('UserAvatar-image');
    expect(img).toHaveAttribute('src', 'http://tofumatt.com/photo.jpg');
  });

  it('renders extra classNames while rendering user avatar', () => {
    const user = getUser({ picture_url: 'http://tofumatt.com/photo.jpg' });
    const className = 'test';
    const { root } = render({ className, user });

    expect(root).toHaveClass(className);
  });

  it('renders an anonymous icon if the user has no photo', () => {
    // Since https://github.com/mozilla/addons-server/issues/7679, the API
    // returns `null` when the user does not have a profile picture.
    const user = getUser({ picture_url: null });
    render({ user });

    expect(screen.getByClassName('Icon-anonymous-user')).toBeInTheDocument();
  });

  it('renders an anonymous icon if there is no user', () => {
    render({ user: undefined });

    expect(screen.getByClassName('Icon-anonymous-user')).toBeInTheDocument();
  });

  it('renders a preview image when supplied', () => {
    const preview = 'https://example.org/image.jpg';
    render({ preview });

    expect(screen.getByTagName('img')).toHaveAttribute('src', preview);
  });

  it('passes the given altText prop to the user picture or preview image', () => {
    const altText = 'some alt text';
    const preview = 'https://example.org/image.jpg';
    render({ altText, preview });

    expect(screen.getByTagName('img')).toHaveAttribute('alt', altText);
  });
});
