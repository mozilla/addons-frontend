import * as React from 'react';
import base64url from 'base64url';

import UsersUnsubscribe, {
  UsersUnsubscribeBase,
} from 'amo/pages/UsersUnsubscribe';
import Card from 'ui/components/Card';
import { getNotificationDescription } from 'amo/utils/notifications';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const getParams = (overrides = {}) => {
    return {
      hash: 'some-hash',
      token: base64url.encode('email@example.org'),
      notificationName: 'new_review',
      ...overrides,
    };
  };

  const render = ({
    i18n = fakeI18n(),
    params = getParams(),
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <UsersUnsubscribe i18n={i18n} match={{ params }} {...props} />,
      UsersUnsubscribeBase,
    );
  };

  it('renders correctly', () => {
    const root = render();

    expect(root.find(Card)).toHaveLength(1);
    expect(root.find(Card)).toHaveProp(
      'header',
      'You are successfully unsubscribed!',
    );
  });

  it('renders an HTML title', () => {
    const root = render();

    expect(root.find('title')).toHaveLength(1);
    expect(root.find('title')).toHaveText('Unsubscribe');
  });

  it('decodes the token to reveal the email of the user', () => {
    const email = 'some@email.example.org';
    const params = getParams({ token: base64url.encode(email) });

    const root = render({ params });

    expect(root.find('.UsersUnsubscribe-content-explanation').html()).toContain(
      `The email address <strong>${email}</strong> will`,
    );
  });

  it('renders a description of the unsubscribed notification', () => {
    const notificationName = 'announcements';
    const params = getParams({ notificationName });

    const root = render({ params });

    expect(root.find('.UsersUnsubscribe-content-notification')).toHaveText(
      getNotificationDescription(fakeI18n(), notificationName),
    );
  });

  it('renders a link to edit the user profile', () => {
    const root = render();

    expect(
      root.find('.UsersUnsubscribe-content-edit-profile').childAt(0),
    ).toHaveText('You can edit your notification settings by ');
    // The second child is a `Link`.
    expect(
      root.find('.UsersUnsubscribe-content-edit-profile').childAt(1),
    ).toHaveProp('to', '/users/edit');
    expect(
      root.find('.UsersUnsubscribe-content-edit-profile').childAt(1),
    ).toHaveProp('children', 'editing your profile');
    expect(
      root.find('.UsersUnsubscribe-content-edit-profile').childAt(2),
    ).toHaveText('.');
  });
});
