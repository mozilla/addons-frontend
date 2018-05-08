import * as React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';

import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import UserProfileEdit, {
  UserProfileEditBase,
} from 'amo/components/UserProfileEdit';
import {
  editUserAccount,
  fetchUserAccount,
  getCurrentUser,
  loadUserAccount,
} from 'amo/reducers/users';
import { USERS_EDIT } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  createUserAccountResponse,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  function defaultUserProps(props = {}) {
    return {
      display_name: 'Matt MacTofu',
      userId: 500,
      username: 'tofumatt',
      ...props,
    };
  }

  function syncPropsAndParamsUsername(username) {
    return {
      params: { username },
      store: dispatchSignInActions({
        userProps: defaultUserProps({ username }),
      }).store,
    };
  }

  function renderUserProfileEdit({
    i18n = fakeI18n(),
    params = { username: 'tofumatt' },
    store = dispatchSignInActions({
      userProps: defaultUserProps(),
    }).store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <UserProfileEdit i18n={i18n} params={params} store={store} {...props} />,
      UserProfileEditBase,
      { shallowOptions: { context: { i18n } } }
    );
  }

  function mountUserProfileEdit({
    errorHandler = createStubErrorHandler(),
    i18n = fakeI18n(),
    params = { username: 'tofumatt' },
    store = dispatchSignInActions({
      userProps: defaultUserProps(),
    }).store,
    ...props
  } = {}) {
    return mount(
      <Provider store={store}>
        <UserProfileEdit
          errorHandler={errorHandler}
          i18n={i18n}
          params={params}
          store={store}
          {...props}
        />
      </Provider>,
      { context: { i18n } }
    );
  }

  it('renders user profile page', () => {
    const root = renderUserProfileEdit();

    expect(root.find('.UserProfileEdit')).toHaveLength(1);
  });

  it('dispatches fetchUserAccount action if username is not found', () => {
    const { store } = syncPropsAndParamsUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const username = 'i-am-not-tofumatt';

    const root = renderUserProfileEdit({ params: { username }, store });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username,
    }));
  });

  it('does not dispatch fetchUserAccount action if there is no username', () => {
    const { store } = syncPropsAndParamsUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    // This happens when loading the user edit profile page of the current
    // logged user (e.g., page refresh).
    renderUserProfileEdit({ params: {}, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('dispatches fetchUserAccount action if username changes', () => {
    const { params, store } = syncPropsAndParamsUsername('black-panther');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.reset();

    // FIXME: make sure this works with react-router + mapStateToProps
    root.setProps({ username: 'killmonger' });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username: 'killmonger',
    }));
  });

  it('does not dispatch fetchUserAccount if username does not change', () => {
    const { params, store } = syncPropsAndParamsUsername('black-panther');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.reset();

    root.setProps({ params });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders a username input field', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit-username')).toHaveLength(1);
  });

  it('renders a disabled username input field when not ready', () => {
    const root = renderUserProfileEdit({ params: { username: 'not-ready' } });

    expect(root.find('.UserProfileEdit-username')).toHaveProp('disabled', true);
  });

  it('renders a disabled "email" input field', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit-email')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-email')).toHaveProp('disabled', true);
  });

  it('renders a help text for the email and homepage fields', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit--help')).toHaveLength(3);
  });

  it('renders a displayName input field', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit-displayName')).toHaveLength(1);
  });

  it('renders a disabled displayName input field when not ready', () => {
    const root = renderUserProfileEdit({ params: { username: 'not-ready' } });

    expect(root.find('.UserProfileEdit-displayName'))
      .toHaveProp('disabled', true);
  });

  it('renders a homepage input field', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit-homepage')).toHaveLength(1);
  });

  it('renders a disabled homepage input field when not ready', () => {
    const root = renderUserProfileEdit({ params: { username: 'not-ready' } });

    expect(root.find('.UserProfileEdit-homepage')).toHaveProp('disabled', true);
  });

  it('renders a location input field', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit-location')).toHaveLength(1);
  });

  it('renders a disabled location input field when not ready', () => {
    const root = renderUserProfileEdit({ params: { username: 'not-ready' } });

    expect(root.find('.UserProfileEdit-location')).toHaveProp('disabled', true);
  });

  it('renders a occupation input field', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit-occupation')).toHaveLength(1);
  });

  it('renders a disabled occupation input field when not ready', () => {
    const root = renderUserProfileEdit({ params: { username: 'not-ready' } });

    expect(root.find('.UserProfileEdit-occupation')).toHaveProp('disabled', true);
  });

  it('renders a biography input field', () => {
    const root = renderUserProfileEdit({ params: { username: 'tofumatt' } });

    expect(root.find('.UserProfileEdit-biography')).toHaveLength(1);
  });

  it('renders a disabled biography input field when not ready', () => {
    const root = renderUserProfileEdit({ params: { username: 'not-ready' } });

    expect(root.find('.UserProfileEdit-biography'))
      .toHaveProp('disabled', true);
  });

  it('dispatches editUserAccount action with all fields', () => {
    const { store } = syncPropsAndParamsUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = mountUserProfileEdit({ errorHandler, store });
    const user = getCurrentUser(store.getState().users);

    root.find('.UserProfileEdit-form').simulate('submit', createFakeEvent());

    sinon.assert.calledWith(dispatchSpy, editUserAccount({
      errorHandlerId: errorHandler.id,
      userFields: {
        biography: '',
        display_name: user.displayName,
        homepage: '',
        location: '',
        occupation: '',
        username: user.username,
      },
      userId: user.id,
    }));
  });

  it('renders a Not Found page when logged user cannot edit another user', () => {
    const username = 'current-logged-user';
    const { store } = dispatchSignInActions({
      userProps: defaultUserProps({
        username,
        permissions: [],
      }),
    });

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // Try to edit this user with another username.
    const params = { username: user.username };
    const root = renderUserProfileEdit({ params, store });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('allows to edit another user if logged user has USERS_EDIT permission', () => {
    const username = 'current-logged-user';
    const { store } = dispatchSignInActions({
      userProps: defaultUserProps({
        username,
        permissions: [USERS_EDIT],
      }),
    });

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // Try to edit this user with another username.
    const params = { username: user.username };
    const root = renderUserProfileEdit({ params, store });

    expect(root.find(NotFound)).toHaveLength(0);
    expect(root.find('.UserProfileEdit-username'))
      .toHaveProp('value', user.username);

    const linkItems = root.find('.UserProfileEdit-user-links li');
    expect(linkItems.at(0).find(Link))
      .toHaveProp('children', "View user's profile");
    // We are on the edit page, so we do not use a link for this item.
    expect(linkItems.at(1).children()).toHaveText("Edit user's profile");
  });

  it('renders errors', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    const root = renderUserProfileEdit({ errorHandler, store });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('returns a 404 if current user is not logged in', () => {
    const { store } = dispatchClientMetadata();

    const root = renderUserProfileEdit({ store });

    expect(root.find(NotFound)).toHaveLength(1);
  });
});
