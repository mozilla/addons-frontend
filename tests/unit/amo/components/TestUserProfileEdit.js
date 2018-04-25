import * as React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';

import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import UserProfileEdit, { UserProfileEditBase } from 'amo/components/UserProfileEdit';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReportUserAbuse from 'amo/components/ReportUserAbuse';
import {
  editUserAccount,
  fetchUserAccount,
  getCurrentUser,
  getUserByUsername,
} from 'amo/reducers/users';
import { createApiError } from 'core/api';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import UserAvatar from 'ui/components/UserAvatar';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
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
  // eslint-disable-next-line padded-blocks
  } = {}) {

    return shallowUntilTarget(
      <UserProfileEdit i18n={i18n} params={params} store={store} {...props} />,
      UserProfileEditBase
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
  // eslint-disable-next-line padded-blocks
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
      </Provider>
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

  it('dispatches fetchUserAccount action if username param changes', () => {
    const { params, store } = syncPropsAndParamsUsername('black-panther');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.reset();

    root.setProps({ params: { username: 'killmonger' } });

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

  // it('renders the user avatar', () => {
  //   const { params, store } = syncPropsAndParamsUsername('black-panther');
  //   const root = renderUserProfile({ params, store });
  //   const header = getHeaderPropComponent(root);

  //   expect(header.find(UserAvatar))
  //     .toHaveProp('user', getCurrentUser(store.getState().users));
  // });

  // it('still passes user prop to avatar while loading', () => {
  //   const root = renderUserProfile({ params: { username: 'not-ready' } });
  //   const header = getHeaderPropComponent(root);

  //   expect(header.find(UserAvatar)).toHaveProp('user', undefined);
  // });

  // it("renders the user's name", () => {
  //   const root = renderUserProfile();
  //   const header = getHeaderPropComponent(root);

  //   expect(header.find('.UserProfile-name')).toHaveText('Matt MacTofu');
  // });

  // it('renders LoadingText instead of inputs when no user is ready', () => {
  //   const root = renderUserProfileEdit({ params: { username: 'not-ready' } });

  //   expect(root.find('.UserProfileEdit-username')).toHaveLength(0);
  //   expect(root.find('.UserProfileEdit-email')).toHaveLength(0);
  //   expect(root.find('.UserProfileEdit-displayName')).toHaveLength(0);
  //   expect(root.find('.UserProfileEdit-homepage')).toHaveLength(0);
  //   expect(root.find('.UserProfileEdit-location')).toHaveLength(0);
  //   expect(root.find('.UserProfileEdit-occupation')).toHaveLength(0);
  //   expect(root.find(LoadingText)).toHaveLength(6);
  // });

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

    expect(root.find('.UserProfileEdit-biography')).toHaveProp('disabled', true);
  });

  it('dispatches editUserAccount action with all fields', () => {
    const { store } = syncPropsAndParamsUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = mountUserProfileEdit({ errorHandler, store });

    const user = getCurrentUser(store.getState().users);

    const textEvent = createFakeEvent();
    const clickEvent = createFakeEvent();
    // root.find('.UserProfileEdit-biography').simulate('change', textEvent);
    root.find('.UserProfileEdit-form').simulate('submit', clickEvent);

    sinon.assert.calledWith(dispatchSpy, editUserAccount({
      errorHandlerId: errorHandler.id,
      userFields: {
        biography: undefined,
        display_name: user.displayName,
        homepage: '',
        location: '',
        occupation: '',
        username: user.username,
      },
      userId: user.id,
    }));
  });

  // it('renders a not found page if the API request is a 404', () => {
  //   const { store } = dispatchSignInActions();
  //   const errorHandler = new ErrorHandler({
  //     id: 'some-error-handler-id',
  //     dispatch: store.dispatch,
  //   });
  //   errorHandler.handle(createApiError({
  //     response: { status: 404 },
  //     apiURL: 'https://some/api/endpoint',
  //     jsonResponse: { message: 'not found' },
  //   }));

  //   const root = renderUserProfile({ errorHandler, store });

  //   expect(root.find(NotFound)).toHaveLength(1);
  // });

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
});
