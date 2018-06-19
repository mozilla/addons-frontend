import * as React from 'react';
import {
  Simulate,
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

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
  createFakeEvent,
  createUserAccountResponse,
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
  userAuthToken,
} from 'tests/unit/helpers';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  function renderTree(customProps = {}) {
    const { store } = dispatchSignInActions();
    const props = {
      handleLogOut: sinon.stub(),
      i18n: fakeI18n(),
      ...customProps,
    };

    return findRenderedComponentWithType(
      renderIntoDocument(
        <Provider store={store}>
          <AuthenticateButtonBase {...props} />
        </Provider>,
      ),
      AuthenticateButtonBase,
    );
  }

  const render = (props) => findDOMNode(renderTree(props));

  it('passes along a className', () => {
    const root = render({ className: 'MyComponent-auth-button' });
    expect(root.classList.contains('MyComponent-auth-button')).toBeTruthy();
  });

  it('renders an Icon by default', () => {
    const root = renderTree();
    const icon = findRenderedComponentWithType(root, Icon);
    expect(icon).toBeTruthy();
  });

  it('lets you hide the Icon', () => {
    const root = renderTree({ noIcon: true });
    expect(() => findRenderedComponentWithType(root, Icon)).toThrowError(
      /Did not find exactly one match/,
    );
  });

  it('lets you customize the log in text', () => {
    const root = render({ logInText: 'Maybe log in?', siteUser: null });
    expect(root.textContent).toEqual('Maybe log in?');
    expect(root.href).toContain('#login');
  });

  it('lets you customize the log out text', () => {
    const user = createUserAccountResponse();
    const root = render({ logOutText: 'Maybe log out?', siteUser: user });
    expect(root.textContent).toEqual('Maybe log out?');
    expect(root.href).toContain('#logout');
  });

  it('shows a log in button when unauthenticated', () => {
    const handleLogIn = sinon.spy();
    const location = fakeRouterLocation();
    const root = render({ handleLogIn, location, siteUser: null });

    expect(root.textContent).toEqual('Register or Log in');
    Simulate.click(root);
    sinon.assert.calledWith(handleLogIn, location);
  });

  it('shows a log out button when authenticated', () => {
    const handleLogOut = sinon.spy();
    const user = createUserAccountResponse();
    const root = render({ handleLogOut, siteUser: user });

    expect(root.textContent).toEqual('Log out');
    Simulate.click(root);
    sinon.assert.called(handleLogOut);
  });

  it('updates the location on handleLogIn', () => {
    const { store } = dispatchSignInActions();
    const _window = { location: '/foo' };
    const location = fakeRouterLocation({
      pathname: '/bar',
      query: { q: 'wat' },
    });
    const startLoginUrlStub = sinon
      .stub(api, 'startLoginUrl')
      .returns('https://a.m.org/login');

    const { handleLogIn } = mapStateToProps(store.getState());
    handleLogIn(location, { _window });

    expect(_window.location).toEqual('https://a.m.org/login');
    sinon.assert.calledWith(startLoginUrlStub, { location });
  });

  it('retrieves `isAuthenticated` from state', () => {
    const { store } = dispatchClientMetadata();
    const user = createUserAccountResponse();

    expect(mapStateToProps(store.getState()).siteUser).toEqual(null);

    store.dispatch(setAuthToken(userAuthToken()));
    store.dispatch(loadCurrentUserAccount({ user }));

    expect(mapStateToProps(store.getState()).siteUser).toMatchObject(user);
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
