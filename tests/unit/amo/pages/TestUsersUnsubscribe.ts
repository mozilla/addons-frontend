import { waitFor } from '@testing-library/react';
import { encode } from 'universal-base64url';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { abortUnsubscribeNotification, finishUnsubscribeNotification, getUnsubscribeKey, unsubscribeNotification, UNSUBSCRIBE_NOTIFICATION } from 'amo/reducers/users';
import { extractId } from 'amo/pages/UsersUnsubscribe';
import { getNotificationDescription } from 'amo/utils/notifications';
import { createFailedErrorHandler, dispatchClientMetadata, fakeI18n, getElement, renderPage as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

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
  } = {}) => {
    return defaultRender({
      initialEntries: [`/en-US/firefox/users/unsubscribe/${params.token}/${params.hash}/${params.notificationName}/`],
      store,
    });
  };

  const _finishUnsubscribeNotification = (overrides = {}) => {
    const params = getParams(overrides);
    store.dispatch(finishUnsubscribeNotification({
      hash: params.hash,
      notification: params.notificationName,
      token: params.token,
    }));
  };

  const createErrorHandlerId = ({
    params = getParams(),
  } = {}) => {
    return `src/amo/pages/UsersUnsubscribe/index.js-${extractId({
      match: {
        params,
      },
    })}`;
  };

  beforeEach(() => {
    store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    }).store;
  });
  it('renders loading indicators when the user is not unsubscribed yet', () => {
    render();
    expect(screen.getAllByRole('alert')).toHaveLength(4);
  });
  it('renders an HTML title', async () => {
    render();
    await waitFor(() => expect(getElement('title')).toHaveTextContent('Unsubscribe'));
  });
  it('dispatches unsubscribeNotification on mount', () => {
    const params = getParams();
    const dispatch = jest.spyOn(store, 'dispatch');
    render({
      params,
    });
    expect(dispatch).toHaveBeenCalledWith(unsubscribeNotification({
      errorHandlerId: createErrorHandlerId(),
      hash: params.hash,
      notification: params.notificationName,
      token: params.token,
    }));
  });
  it('does not dispatch unsubscribeNotification if the operation has been aborted', () => {
    const params = getParams();
    store.dispatch(abortUnsubscribeNotification({
      hash: params.hash,
      notification: params.notificationName,
      token: params.token,
    }));
    const dispatch = jest.spyOn(store, 'dispatch');
    render({
      params,
    });
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({
      type: UNSUBSCRIBE_NOTIFICATION,
    }));
  });
  it('does not dispatch unsubscribeNotification if already dispatched', () => {
    const params = getParams();

    _finishUnsubscribeNotification(params);

    const dispatch = jest.spyOn(store, 'dispatch');
    render({
      params,
    });
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({
      type: UNSUBSCRIBE_NOTIFICATION,
    }));
  });
  it('renders errors', () => {
    const message = 'some unexpected error';
    createFailedErrorHandler({
      id: createErrorHandlerId(),
      message,
      store,
    });
    render();
    expect(screen.getByText(message)).toBeInTheDocument();
  });
  describe('when user is successfully unsubscribed', () => {
    it('decodes the token to reveal the email of the user', () => {
      const email = 'some@email.example.org';
      const params = getParams({
        token: encode(email),
      });

      _finishUnsubscribeNotification(params);

      render({
        params,
      });
      expect(screen.getByText(email)).toBeInTheDocument();
    });
    it('renders a description of the unsubscribed notification', () => {
      const notificationName = 'announcements';
      const params = getParams({
        notificationName,
      });

      _finishUnsubscribeNotification(params);

      render({
        params,
      });
      expect(screen.getByText(getNotificationDescription(fakeI18n(), notificationName))).toBeInTheDocument();
    });
    it('renders a link to edit the user profile', () => {
      _finishUnsubscribeNotification();

      render();
      expect(screen.getByRole('link', {
        name: 'editing your profile',
      })).toHaveAttribute('href', '/en-US/firefox/users/edit');
    });
  });
  describe('extractId', () => {
    it('returns a unique ID using getUnsubscribeKey()', () => {
      const params = getParams();
      const ownProps = {
        match: {
          params,
        },
      };
      expect(extractId(ownProps)).toEqual(getUnsubscribeKey({
        hash: params.hash,
        notification: params.notificationName,
        token: params.token,
      }));
    });
  });
});