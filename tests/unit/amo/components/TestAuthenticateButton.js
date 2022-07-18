/* global window */
import * as React from 'react';
import { createEvent, fireEvent } from '@testing-library/react';
import defaultUserEvent from '@testing-library/user-event';

import { logOutUser } from 'amo/reducers/users';
import * as api from 'amo/api';
import AuthenticateButton, {
  createHandleLogOutFunction,
} from 'amo/components/AuthenticateButton';
import { loadSiteStatus } from 'amo/reducers/site';
import {
  createHistory,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  let userEvent;

  const savedLocation = window.location;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
    delete window.location;
    window.location = Object.assign(new URL('https://example.org'), {
      assign: jest.fn(),
    });
    userEvent = defaultUserEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
    window.location = savedLocation;
  });

  const render = ({ location, ...props } = {}) => {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || '/'],
      }),
      store,
    };
    return defaultRender(<AuthenticateButton {...props} />, renderOptions);
  };

  it('passes along a className', () => {
    const className = 'MyComponent-auth-button';
    render({ className });

    expect(screen.getByRole('link')).toHaveClass(className);
  });

  it('renders an Icon by default', () => {
    render();

    expect(screen.getByClassName('Icon-user-dark')).toBeInTheDocument();
  });

  it('lets you hide the Icon', () => {
    render({ noIcon: true });

    expect(screen.queryByClassName('Icon-user-dark')).not.toBeInTheDocument();
  });

  it('lets you customize the log in text', () => {
    const logInText = 'Maybe log in?';
    render({ logInText });

    expect(screen.getByRole('link', { name: logInText })).toHaveAttribute(
      'href',
      '#login',
    );
  });

  it('lets you customize the log out text', () => {
    const logOutText = 'Maybe log out?';
    dispatchSignInActionsWithStore({ store });
    render({ logOutText });

    expect(screen.getByRole('link', { name: logOutText })).toHaveAttribute(
      'href',
      '#logout',
    );
  });

  it('shows a log in button when unauthenticated', () => {
    const handleLogIn = jest.fn();
    const location = '/some-location/';
    render({ handleLogIn, location });

    const link = screen.getByRole('link', { name: 'Log in' });
    const clickEvent = createEvent.click(link);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(link, clickEvent);
    expect(handleLogIn).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: location }),
    );
    expect(preventDefaultWatcher).toHaveBeenCalled();
  });

  it('shows a log out button when authenticated', () => {
    dispatchSignInActionsWithStore({ store });
    const handleLogOut = jest.fn();
    render({ handleLogOut });

    const link = screen.getByRole('link', { name: 'Log out' });
    const clickEvent = createEvent.click(link);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(link, clickEvent);
    expect(handleLogOut).toHaveBeenCalledWith({ api: store.getState().api });
    expect(preventDefaultWatcher).toHaveBeenCalled();
  });

  it('updates the location on handleLogIn', async () => {
    const location = '/some/location/';
    const mockLoginURL = '/some/login/';
    const startLoginUrl = jest.spyOn(api, 'startLoginUrl');
    startLoginUrl.mockReturnValue(mockLoginURL);
    render({ location });

    await userEvent.click(screen.getByRole('link', { name: 'Log in' }));

    expect(startLoginUrl).toHaveBeenCalledWith({
      location: expect.objectContaining({ pathname: location }),
    });
    expect(window.location.assign).toHaveBeenCalledWith(mockLoginURL);
  });

  it('calls logOutFromServer on handleLogOut', async () => {
    const logOutFromServer = jest.spyOn(api, 'logOutFromServer');
    logOutFromServer.mockResolvedValue(true);
    dispatchSignInActionsWithStore({ store });
    render();

    const apiStateBeforeLogout = store.getState().api;

    await userEvent.click(screen.getByRole('link', { name: 'Log out' }));

    expect(logOutFromServer).toHaveBeenCalledWith({
      api: apiStateBeforeLogout,
    });
  });

  it('is disabled when the site is in readonly mode', () => {
    store.dispatch(loadSiteStatus({ readOnly: true, notice: null }));

    render();

    expect(
      screen.getByTitle(
        'This action is currently unavailable. Please reload the page in a moment.',
      ),
    ).toHaveClass('Button--disabled');
  });

  it('is not disabled when the site is not in readonly mode', () => {
    store.dispatch(loadSiteStatus({ readOnly: false, notice: null }));

    render();

    expect(screen.getByRole('link', { name: 'Log in' })).not.toHaveClass(
      'Button--disabled',
    );
  });

  describe('createHandleLogOutFunction()', () => {
    it('logs out a signed-in user on the client side even if the API returns an error', () => {
      const error = api.createApiError({ response: { status: 401 } });
      const dispatch = jest.spyOn(store, 'dispatch');
      const logOutFromServer = jest.spyOn(api, 'logOutFromServer');
      logOutFromServer.mockRejectedValue(error);
      dispatchSignInActionsWithStore({ store });

      const handleLogOut = createHandleLogOutFunction(dispatch);
      const apiState = store.getState().api;
      // This makes sure the state contains a token because user is logged in.
      expect(apiState.token).toBeTruthy();

      return handleLogOut({ api: apiState }).then(() => {
        expect(logOutFromServer).toHaveBeenCalledWith({
          api: apiState,
        });
        expect(dispatch).toHaveBeenCalledWith(logOutUser());
      });
    });

    it('logs out a signed-in user on the server and client sides', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const logOutFromServer = jest.spyOn(api, 'logOutFromServer');
      logOutFromServer.mockResolvedValue(true);
      dispatchSignInActionsWithStore({ store });

      const handleLogOut = createHandleLogOutFunction(dispatch);
      const apiState = store.getState().api;
      // This makes sure the state contains a token because user is logged in.
      expect(apiState.token).toBeTruthy();

      return handleLogOut({ api: apiState }).then(() => {
        expect(logOutFromServer).toHaveBeenCalledWith({
          api: apiState,
        });
        expect(dispatch).toHaveBeenCalledWith(logOutUser());
      });
    });
  });
});
