import * as React from 'react';
import base64url from 'base64url';

import {
  abortUnsubscribeNotification,
  finishUnsubscribeNotification,
  getUnsubscribeKey,
  unsubscribeNotification,
} from 'amo/reducers/users';
import UsersUnsubscribe, {
  UsersUnsubscribeBase,
  extractId,
} from 'amo/pages/UsersUnsubscribe';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import { getNotificationDescription } from 'amo/utils/notifications';
import { ErrorHandler } from 'amo/errorHandler';
import ErrorList from 'amo/components/ErrorList';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

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
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <UsersUnsubscribe
        i18n={i18n}
        match={{ params }}
        store={store}
        {...props}
      />,
      UsersUnsubscribeBase,
    );
  };

  const _finishUnsubscribeNotification = (store, overrides = {}) => {
    const params = getParams(overrides);

    store.dispatch(
      finishUnsubscribeNotification({
        hash: params.hash,
        notification: params.notificationName,
        token: params.token,
      }),
    );
  };

  it('renders loading indicators when the user is not unsubscribed yet', () => {
    const root = render();

    expect(root.find(Card)).toHaveLength(1);
    expect(root.find(Card)).toHaveProp('header', <LoadingText />);

    expect(
      root.find('.UsersUnsubscribe-content-explanation').find(LoadingText),
    ).toHaveLength(1);

    expect(
      root.find('.UsersUnsubscribe-content-notification').find(LoadingText),
    ).toHaveLength(1);

    expect(
      root.find('.UsersUnsubscribe-content-edit-profile').find(LoadingText),
    ).toHaveLength(1);
  });

  it('renders an HTML title', () => {
    const root = render();

    expect(root.find('title')).toHaveLength(1);
    expect(root.find('title')).toHaveText('Unsubscribe');
  });

  it('dispatches unsubscribeNotification on mount', () => {
    const params = getParams();
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ params, store });

    sinon.assert.calledWith(
      dispatchSpy,
      unsubscribeNotification({
        errorHandlerId: root.instance().props.errorHandler.id,
        hash: params.hash,
        notification: params.notificationName,
        token: params.token,
      }),
    );
  });

  it('does not dispatch unsubscribeNotification if the operation has been aborted', () => {
    const params = getParams();
    const { store } = dispatchClientMetadata();
    store.dispatch(
      abortUnsubscribeNotification({
        hash: params.hash,
        notification: params.notificationName,
        token: params.token,
      }),
    );
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ params, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not dispatch unsubscribeNotification if already dispatched', () => {
    const params = getParams();
    const { store } = dispatchClientMetadata();
    _finishUnsubscribeNotification(store, params);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ params, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders errors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    const root = render({ errorHandler, store });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  describe('when user is successfully unsubscribed', () => {
    it('decodes the token to reveal the email of the user', () => {
      const email = 'some@email.example.org';
      const params = getParams({ token: base64url.encode(email) });
      const { store } = dispatchClientMetadata();
      _finishUnsubscribeNotification(store, params);

      const root = render({ params, store });

      expect(
        root.find('.UsersUnsubscribe-content-explanation').html(),
      ).toContain(`The email address <strong>${email}</strong> will`);
    });

    it('renders a description of the unsubscribed notification', () => {
      const notificationName = 'announcements';
      const params = getParams({ notificationName });
      const { store } = dispatchClientMetadata();
      _finishUnsubscribeNotification(store, params);

      const root = render({ params, store });

      expect(root.find('.UsersUnsubscribe-content-notification')).toHaveText(
        getNotificationDescription(fakeI18n(), notificationName),
      );
    });

    it('renders a link to edit the user profile', () => {
      const { store } = dispatchClientMetadata();
      _finishUnsubscribeNotification(store);

      const root = render({ store });

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

  describe('extractId', () => {
    it('returns a unique ID using getUnsubscribeKey()', () => {
      const params = getParams();
      const ownProps = { match: { params } };

      expect(extractId(ownProps)).toEqual(
        getUnsubscribeKey({
          hash: params.hash,
          notification: params.notificationName,
          token: params.token,
        }),
      );
    });
  });
});
