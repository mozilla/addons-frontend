import * as React from 'react';
import { waitFor } from '@testing-library/react';
import { encode } from 'universal-base64url';

import {
  abortUnsubscribeNotification,
  finishUnsubscribeNotification,
  getUnsubscribeKey,
  unsubscribeNotification,
} from 'amo/reducers/users';
import UsersUnsubscribe, { extractId } from 'amo/pages/UsersUnsubscribe';
import { getNotificationDescription } from 'amo/utils/notifications';
import { ErrorHandler } from 'amo/errorHandler';
import {
  dispatchClientMetadata,
  fakeI18n,
  getElement,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getParams = (overrides = {}) => {
    return {
      hash: 'some-hash',
      token: encode('email@example.org'),
      notificationName: 'new_review',
      ...overrides,
    };
  };

  const render = ({
    params = getParams(),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return defaultRender(
      <UsersUnsubscribe match={{ params }} store={store} {...props} />,
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

  const createErrorHandlerId = ({ params }) => {
    return `src/amo/pages/UsersUnsubscribe/index.js-${extractId({
      match: { params },
    })}`;
  };

  it('renders loading indicators when the user is not unsubscribed yet', () => {
    render();

    expect(screen.getAllByRole('alert')).toHaveLength(4);
  });

  it('renders an HTML title', async () => {
    render();

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent('Unsubscribe');
  });

  it('dispatches unsubscribeNotification on mount', () => {
    const params = getParams();
    const { store } = dispatchClientMetadata();
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ params, store });

    expect(dispatch).toHaveBeenCalledWith(
      unsubscribeNotification({
        errorHandlerId: createErrorHandlerId({ params }),
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
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ params, store });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch unsubscribeNotification if already dispatched', () => {
    const params = getParams();
    const { store } = dispatchClientMetadata();
    _finishUnsubscribeNotification(store, params);
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ params, store });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('renders errors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    render({ errorHandler, store });

    expect(
      screen.getByText('An unexpected error occurred'),
    ).toBeInTheDocument();
  });

  describe('when user is successfully unsubscribed', () => {
    it('decodes the token to reveal the email of the user', () => {
      const email = 'some@email.example.org';
      const params = getParams({ token: encode(email) });
      const { store } = dispatchClientMetadata();
      _finishUnsubscribeNotification(store, params);

      render({ params, store });

      expect(screen.getByText(email)).toBeInTheDocument();
    });

    it('renders a description of the unsubscribed notification', () => {
      const notificationName = 'announcements';
      const params = getParams({ notificationName });
      const { store } = dispatchClientMetadata();
      _finishUnsubscribeNotification(store, params);

      render({ params, store });

      expect(
        screen.getByText(
          getNotificationDescription(fakeI18n(), notificationName),
        ),
      ).toBeInTheDocument();
    });

    it('renders a link to edit the user profile', () => {
      const { store } = dispatchClientMetadata();
      _finishUnsubscribeNotification(store);

      render({ store });

      const link = screen.getByRole('link', { name: 'editing your profile' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/en-US/android/users/edit');
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
