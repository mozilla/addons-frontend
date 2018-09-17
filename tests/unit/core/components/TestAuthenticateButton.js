import * as React from 'react';

import { setAuthToken } from 'core/actions';
import { loadCurrentUserAccount, logOutUser } from 'amo/reducers/users';
import * as api from 'core/api';
import AuthenticateButton, {
  AuthenticateButtonBase,
  createHandleLogOutFunction,
  mapStateToProps,
} from 'core/components/AuthenticateButton';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createUserAccountResponse,
  fakeI18n,
  createFakeLocation,
  shallowUntilTarget,
  userAuthToken,
} from 'tests/unit/helpers';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  function render({ location = createFakeLocation(), ...customProps } = {}) {
    const { store } = dispatchSignInActions();
    const props = {
      handleLogOut: sinon.stub(),
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(
      <AuthenticateButton {...props} />,
      AuthenticateButtonBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  }

  it('passes along a className', () => {
    const className = 'MyComponent-auth-button';
    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

  it('renders an Icon by default', () => {
    const root = render();

    expect(root.find(Icon)).toHaveLength(1);
  });

  it('lets you hide the Icon', () => {
    const root = render({ noIcon: true });

    expect(root.find(Icon)).toHaveLength(0);
  });

  it('lets you customize the log in text', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ logInText: 'Maybe log in?', store });

    expect(root.childAt(1)).toHaveText('Maybe log in?');
    expect(root).toHaveProp('href', '#login');
  });

  it('lets you customize the log out text', () => {
    const { store } = dispatchSignInActions();
    const root = render({ logOutText: 'Maybe log out?', store });

    expect(root.childAt(1)).toHaveText('Maybe log out?');
    expect(root).toHaveProp('href', '#logout');
  });

  it('shows a log in button when unauthenticated', () => {
    const { store } = dispatchClientMetadata();
    const handleLogIn = sinon.spy();
    const location = createFakeLocation();
    const root = render({ handleLogIn, location, store });

    expect(root.childAt(1)).toHaveText('Register or Log in');

    const clickEvent = createFakeEvent();
    root.simulate('click', clickEvent);

    sinon.assert.calledWith(handleLogIn, location);
    sinon.assert.calledOnce(clickEvent.preventDefault);
  });

  it('shows a log out button when authenticated', () => {
    const { store } = dispatchSignInActions();
    const handleLogOut = sinon.spy();
    const root = render({ handleLogOut, store });

    expect(root.childAt(1)).toHaveText('Log out');

    const clickEvent = createFakeEvent();
    root.simulate('click', clickEvent);

    sinon.assert.calledOnce(handleLogOut);
    sinon.assert.calledOnce(clickEvent.preventDefault);
  });

  it('updates the location on handleLogIn', () => {
    const { store } = dispatchSignInActions();
    const _window = { location: '/foo' };
    const location = createFakeLocation({
      pathname: '/bar',
      query: { q: 'wat' },
    });
    const startLoginUrlStub = sinon
      .stub(api, 'startLoginUrl')
      .returns('https://a.m.org/login');

    const { handleLogIn } = mapStateToProps(store.getState(), {});
    handleLogIn(location, { _window });

    expect(_window.location).toEqual('https://a.m.org/login');
    sinon.assert.calledWith(startLoginUrlStub, { location });
  });

  it('retrieves `isAuthenticated` from state', () => {
    const { store } = dispatchClientMetadata();
    const user = createUserAccountResponse();

    expect(mapStateToProps(store.getState(), {}).siteUser).toEqual(null);

    store.dispatch(setAuthToken(userAuthToken()));
    store.dispatch(loadCurrentUserAccount({ user }));

    expect(mapStateToProps(store.getState(), {}).siteUser).toMatchObject(user);
  });

  it('allows a signed-in user to log out', () => {
    const { store } = dispatchSignInActions();
    const handleLogOut = sinon.stub();
    const allProps = {
      handleLogOut,
      i18n: fakeI18n(),
    };

    const wrapper = shallowUntilTarget(
      <AuthenticateButton store={store} {...allProps} />,
      AuthenticateButtonBase,
      {
        shallowOptions: createContextWithFakeRouter(),
      },
    );

    wrapper.simulate('click', createFakeEvent());

    sinon.assert.calledWith(handleLogOut, {
      api: store.getState().api,
    });
  });

  describe('createHandleLogOutFunction()', () => {
    it('logs out a signed-in user on the server and client sides', () => {
      sinon.stub(api, 'logOutFromServer').returns(Promise.resolve());

      const { store, state } = dispatchSignInActions();
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const handleLogOut = createHandleLogOutFunction(dispatchSpy);
      const apiState = state.api;
      // This makes sure the state contains a token because user is logged in.
      expect(apiState.token).toBeTruthy();

      return handleLogOut({ api: apiState }).then(() => {
        sinon.assert.calledWith(api.logOutFromServer, { api: apiState });
        sinon.assert.calledWith(dispatchSpy, logOutUser());
      });
    });
  });
});
