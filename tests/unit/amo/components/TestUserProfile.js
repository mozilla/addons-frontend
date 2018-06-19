import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import UserProfile, {
  extractId,
  UserProfileBase,
} from 'amo/components/UserProfile';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReportUserAbuse from 'amo/components/ReportUserAbuse';
import {
  fetchUserAccount,
  getCurrentUser,
  loadUserAccount,
} from 'amo/reducers/users';
import { createApiError } from 'core/api';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  USERS_EDIT,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import UserAvatar from 'ui/components/UserAvatar';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
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

  function renderUserProfile({
    i18n = fakeI18n(),
    params = { username: 'tofumatt' },
    store = dispatchSignInActions({
      userProps: defaultUserProps(),
    }).store,
    ...props
  // eslint-disable-next-line padded-blocks
  } = {}) {

    return shallowUntilTarget(
      <UserProfile i18n={i18n} params={params} store={store} {...props} />,
      UserProfileBase,
    );
  }

  function getHeaderPropComponent(root) {
    const headerContent = root.find('.UserProfile-user-info').prop('header');
    return shallow(<div>{headerContent}</div>);
  }

  it('renders user profile page', () => {
    const root = renderUserProfile();

    expect(root.find('.UserProfile')).toHaveLength(1);
  });

  it('dispatches fetchUserAccount action if username is not found', () => {
    const { store } = syncPropsAndParamsUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const username = 'i-am-not-tofumatt';

    const root = renderUserProfile({ params: { username }, store });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username,
    }));
  });

  it('dispatches fetchUserAccount action if username param changes', () => {
    const { params, store } = syncPropsAndParamsUsername('black-panther');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfile({ params, store });

    dispatchSpy.resetHistory();

    root.setProps({ params: { username: 'killmonger' } });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username: 'killmonger',
    }));
  });

  it('does not dispatch fetchUserAccount if username does not change', () => {
    const { params, store } = syncPropsAndParamsUsername('black-panther');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfile({ params, store });

    dispatchSpy.resetHistory();

    root.setProps({ params });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders the user avatar', () => {
    const { params, store } = syncPropsAndParamsUsername('black-panther');
    const root = renderUserProfile({ params, store });
    const header = getHeaderPropComponent(root);

    expect(header.find(UserAvatar))
      .toHaveProp('user', getCurrentUser(store.getState().users));
  });

  it('still passes user prop to avatar while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-ready' } });
    const header = getHeaderPropComponent(root);

    expect(header.find(UserAvatar)).toHaveProp('user', undefined);
  });

  it("renders the user's name", () => {
    const root = renderUserProfile();
    const header = getHeaderPropComponent(root);

    expect(header.find('.UserProfile-name')).toHaveText('Matt MacTofu');
  });

  it('renders LoadingText when user name is not ready', () => {
    const root = renderUserProfile({ params: { username: 'not-ready' } });
    const header = getHeaderPropComponent(root);

    expect(header.find('.UserProfile-name').find(LoadingText))
      .toHaveLength(1);
  });

  it("renders the user's username if no display name exists", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        display_name: null,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });
    const header = getHeaderPropComponent(root);

    expect(header.find('.UserProfile-name')).toHaveText('tofumatt');
  });

  it("renders the user's homepage", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        homepage: 'http://hamsterdance.com/',
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-homepage')).toHaveLength(1);
    expect(root.find('.UserProfile-homepage').children())
      .toHaveText('hamsterdance.com/');
  });

  it("omits homepage if the user doesn't have one set", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        homepage: null,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-homepage')).toHaveLength(0);
  });

  it("renders the user's occupation", () => {
    const occupation = 'some occupation';

    const { store } = dispatchSignInActions({
      userProps: {
        occupation,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-occupation')).toHaveLength(1);
    expect(root.find('.UserProfile-occupation').children())
      .toHaveText(occupation);
  });

  it("omits occupation if the user doesn't have one set", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        occupation: null,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-occupation')).toHaveLength(0);
  });

  it("renders the user's location", () => {
    const location = 'some location';

    const { store } = dispatchSignInActions({
      userProps: {
        location,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-location')).toHaveLength(1);
    expect(root.find('.UserProfile-location').children()).toHaveText(location);
  });

  it("omits location if the user doesn't have one set", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        location: null,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-location')).toHaveLength(0);
  });

  it("renders the user's account creation date", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        created: '2000-08-15T12:01:13Z',
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-user-since')).toHaveLength(1);
    expect(root.find('.UserProfile-user-since').children())
      .toHaveText('Aug 15, 2000');
  });

  it('renders LoadingText for account creation date while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-user-since')).toHaveLength(1);
    expect(root.find('.UserProfile-user-since').find(LoadingText))
      .toHaveLength(1);
  });

  it("renders the user's number of add-ons", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        num_addons_listed: 70,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-number-of-addons')).toHaveLength(1);
    expect(root.find('.UserProfile-number-of-addons').children())
      .toHaveText('70');
  });

  it('renders LoadingText for number of add-ons while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-number-of-addons')).toHaveLength(1);
    expect(root.find('.UserProfile-number-of-addons').find(LoadingText))
      .toHaveLength(1);
  });

  it("renders the user's average add-on rating", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        average_addon_rating: 4.1,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-rating-average')).toHaveLength(1);
    expect(root.find('.UserProfile-rating-average').find(Rating))
      .toHaveProp('rating', 4.1);
  });

  it('renders LoadingText for average add-on rating while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-rating-average')).toHaveLength(1);
    expect(root.find('.UserProfile-rating-average').find(LoadingText))
      .toHaveLength(1);
  });

  it("renders the user's biography", () => {
    const { store } = dispatchSignInActions({
      userProps: {
        biography: 'Not even vegan!',
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-biography')).toHaveLength(1);
    expect(root.find('.UserProfile-biography'))
      .toHaveProp('term', 'Biography');
    expect(root.find('.UserProfile-biography').find('p').html())
      .toContain('Not even vegan!');
  });

  it('omits a null biography', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        biography: null,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-biography')).toHaveLength(0);
  });

  it('omits an empty biography', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        biography: '',
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-biography')).toHaveLength(0);
  });

  it('does not render a report abuse button if user is the current logged-in user', () => {
    const root = renderUserProfile();

    expect(root.find(ReportUserAbuse)).toHaveLength(0);
  });

  it('renders a report abuse button if user is not logged-in', () => {
    const { store } = dispatchClientMetadata();
    const root = renderUserProfile({ store });

    expect(root.find(ReportUserAbuse)).toHaveLength(1);
  });

  it('renders a report abuse button if user is not the current logged-in user', () => {
    const username = 'current-logged-in-user';
    const { store } = dispatchSignInActions({
      userProps: {
        username,
      },
    });

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // See this other user profile page.
    const params = { username: user.username };
    const root = renderUserProfile({ params, store });

    expect(root.find(ReportUserAbuse)).toHaveLength(1);
  });

  it('still renders a report abuse component if user is not loaded', () => {
    // The ReportUserAbuse handles an empty `user` object so we should
    // always pass the `user` prop to it.
    const root = renderUserProfile({ params: { username: 'not-loaded' } });

    expect(root.find(ReportUserAbuse)).toHaveLength(1);
  });

  it('renders two AddonsByAuthorsCard', () => {
    const root = renderUserProfile();

    expect(root.find(AddonsByAuthorsCard)).toHaveLength(2);
  });

  it('renders AddonsByAuthorsCard for extensions', () => {
    const root = renderUserProfile();

    expect(root.find(AddonsByAuthorsCard).at(0))
      .toHaveProp('addonType', ADDON_TYPE_EXTENSION);
  });

  it('renders AddonsByAuthorsCard for themes', () => {
    const root = renderUserProfile();

    expect(root.find(AddonsByAuthorsCard).at(1))
      .toHaveProp('addonType', ADDON_TYPE_THEME);
  });

  it('renders no AddonsByAuthorsCard if no user found', () => {
    const root = renderUserProfile({ params: { username: 'not-loaded' } });

    expect(root.find(AddonsByAuthorsCard)).toHaveLength(0);
  });

  it('renders a not found page if the API request is a 404', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(createApiError({
      response: { status: 404 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'not found' },
    }));

    const root = renderUserProfile({ errorHandler, store });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders errors', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    const root = renderUserProfile({ errorHandler, store });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('renders an edit link', () => {
    const root = renderUserProfile();

    expect(root.find('.UserProfile-edit-link')).toHaveLength(1);
    expect(root.find('.UserProfile-edit-link'))
      .toHaveProp('to', `/users/edit`);
    expect(root.find('.UserProfile-edit-link').children())
      .toHaveText('Edit profile');
  });

  it('does not render an edit link if no user found', () => {
    const root = renderUserProfile({ params: { username: 'not-loaded' } });

    expect(root.find('.UserProfile-edit-link')).toHaveLength(0);
  });

  it('renders an edit link if user has sufficient permission', () => {
    const username = 'current-logged-in-user';
    const { store } = dispatchSignInActions({
      userProps: {
        username,
        permissions: [USERS_EDIT],
      },
    });

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // See this other user profile page.
    const params = { username: user.username };
    const root = renderUserProfile({ params, store });

    expect(root.find('.UserProfile-edit-link')).toHaveLength(1);
    expect(root.find('.UserProfile-edit-link'))
      .toHaveProp('to', `/user/${user.username}/edit/`);
  });

  it('does not render an edit link if user is not allowed to edit other users', () => {
    const username = 'current-logged-in-user';
    const { store } = dispatchSignInActions({
      userProps: {
        username,
        permissions: [],
      },
    });

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // See this other user profile page.
    const params = { username: user.username };
    const root = renderUserProfile({ params, store });

    expect(root.find('.UserProfile-edit-link')).toHaveLength(0);
  });

  it('does not render an edit link if user is not found', () => {
    const username = 'current-logged-in-user';
    const { store } = dispatchSignInActions({
      userProps: {
        username,
        permissions: [USERS_EDIT],
      },
    });

    // We browse another user profile page for a user that is not loaded in the
    // state.
    const params = { username: 'another-user' };
    const root = renderUserProfile({ params, store });

    expect(root.find('.UserProfile-edit-link')).toHaveLength(0);
  });

  it('does not dispatch any action when there is an error', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: fakeDispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    fakeDispatch.resetHistory();

    renderUserProfile({ errorHandler, store });

    sinon.assert.notCalled(fakeDispatch);
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const username = 'foo';
      const params = { username };

      expect(extractId({ params })).toEqual(username);
    });
  });
});
