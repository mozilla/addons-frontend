import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import UserProfileEdit, { UserProfileEditBase } from 'amo/components/UserProfileEdit';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReportUserAbuse from 'amo/components/ReportUserAbuse';
import { fetchUserAccount, getCurrentUser } from 'amo/reducers/users';
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
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


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

  // it('renders LoadingText when user name is not ready', () => {
  //   const root = renderUserProfile({ params: { username: 'not-ready' } });
  //   const header = getHeaderPropComponent(root);

  //   expect(header.find('.UserProfile-name').find(LoadingText))
  //     .toHaveLength(1);
  // });

  // it("renders the user's username if no display name exists", () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       display_name: null,
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });
  //   const header = getHeaderPropComponent(root);

  //   expect(header.find('.UserProfile-name')).toHaveText('tofumatt');
  // });

  // it("renders the user's homepage", () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       homepage: 'http://hamsterdance.com/',
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-homepage')).toHaveLength(1);
  //   expect(root.find('.UserProfile-homepage').children())
  //     .toHaveText('hamsterdance.com/');
  // });

  // it("omits homepage if the user doesn't have one set", () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       homepage: null,
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-homepage')).toHaveLength(0);
  // });

  // it("renders the user's account creation date", () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       created: '2000-08-15T12:01:13Z',
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-user-since')).toHaveLength(1);
  //   expect(root.find('.UserProfile-user-since').children())
  //     .toHaveText('Aug 15, 2000');
  // });

  // it('renders LoadingText for account creation date while loading', () => {
  //   const root = renderUserProfile({ params: { username: 'not-tofu' } });

  //   expect(root.find('.UserProfile-user-since')).toHaveLength(1);
  //   expect(root.find('.UserProfile-user-since').find(LoadingText))
  //     .toHaveLength(1);
  // });

  // it("renders the user's number of add-ons", () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       num_addons_listed: 70,
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-number-of-addons')).toHaveLength(1);
  //   expect(root.find('.UserProfile-number-of-addons').children())
  //     .toHaveText('70');
  // });

  // it('renders LoadingText for number of add-ons while loading', () => {
  //   const root = renderUserProfile({ params: { username: 'not-tofu' } });

  //   expect(root.find('.UserProfile-number-of-addons')).toHaveLength(1);
  //   expect(root.find('.UserProfile-number-of-addons').find(LoadingText))
  //     .toHaveLength(1);
  // });

  // it("renders the user's average add-on rating", () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       average_addon_rating: 4.1,
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-rating-average')).toHaveLength(1);
  //   expect(root.find('.UserProfile-rating-average').find(Rating))
  //     .toHaveProp('rating', 4.1);
  // });

  // it('renders LoadingText for average add-on rating while loading', () => {
  //   const root = renderUserProfile({ params: { username: 'not-tofu' } });

  //   expect(root.find('.UserProfile-rating-average')).toHaveLength(1);
  //   expect(root.find('.UserProfile-rating-average').find(LoadingText))
  //     .toHaveLength(1);
  // });

  // it("renders the user's biography", () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       biography: 'Not even vegan!',
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-biography').render().html())
  //     .toContain('Not even vegan!');
  // });

  // it('omits a null biography', () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       biography: null,
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-biography')).toHaveLength(0);
  // });

  // it('omits an empty biography', () => {
  //   const { store } = dispatchSignInActions({
  //     userProps: {
  //       biography: '',
  //       username: 'tofumatt',
  //     },
  //   });
  //   const root = renderUserProfile({ store });

  //   expect(root.find('.UserProfile-biography')).toHaveLength(0);
  // });

  // it('renders a report abuse button if user is loaded', () => {
  //   const root = renderUserProfile();

  //   expect(root.find(ReportUserAbuse)).toHaveLength(1);
  // });

  // it('still renders a report abuse component if user is not loaded', () => {
  //   // The ReportUserAbuse handles an empty `user` object so we should
  //   // always pass the `user` prop to it.
  //   const root = renderUserProfile({ params: { username: 'not-loaded' } });

  //   expect(root.find(ReportUserAbuse)).toHaveLength(1);
  // });

  // it('renders two AddonsByAuthorsCard', () => {
  //   const root = renderUserProfile();

  //   expect(root.find(AddonsByAuthorsCard)).toHaveLength(2);
  // });

  // it('renders AddonsByAuthorsCard for extensions', () => {
  //   const root = renderUserProfile();

  //   expect(root.find(AddonsByAuthorsCard).at(0))
  //     .toHaveProp('addonType', ADDON_TYPE_EXTENSION);
  // });

  // it('renders AddonsByAuthorsCard for themes', () => {
  //   const root = renderUserProfile();

  //   expect(root.find(AddonsByAuthorsCard).at(1))
  //     .toHaveProp('addonType', ADDON_TYPE_THEME);
  // });

  // it('renders no AddonsByAuthorsCard if no user found', () => {
  //   const root = renderUserProfile({ params: { username: 'not-loaded' } });

  //   expect(root.find(AddonsByAuthorsCard)).toHaveLength(0);
  // });

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

  // it('renders errors', () => {
  //   const { store } = dispatchSignInActions();
  //   const errorHandler = new ErrorHandler({
  //     id: 'some-id',
  //     dispatch: store.dispatch,
  //   });
  //   errorHandler.handle(new Error('unexpected error'));

  //   const root = renderUserProfile({ errorHandler, store });

  //   expect(root.find(ErrorList)).toHaveLength(1);
  // });
});
