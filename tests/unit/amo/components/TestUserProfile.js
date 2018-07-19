import * as React from 'react';
import { shallow } from 'enzyme';

import { fetchUserReviews, setUserReviews } from 'amo/actions/reviews';
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
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'core/api';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  USERS_EDIT,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import UserAvatar from 'ui/components/UserAvatar';
import UserReview from 'ui/components/UserReview';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeReview,
} from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  createUserAccountResponse,
  fakeI18n,
  fakeRouterLocation,
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

  function signInUserWithUsername(username) {
    return {
      params: { username },
      store: dispatchSignInActions({
        userProps: defaultUserProps({ username }),
      }).store,
    };
  }

  function renderUserProfile({
    i18n = fakeI18n(),
    location = fakeRouterLocation(),
    params = { username: 'tofumatt' },
    store = dispatchSignInActions({
      userProps: defaultUserProps(),
    }).store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <UserProfile
        i18n={i18n}
        location={location}
        match={{ params }}
        store={store}
        {...props}
      />,
      UserProfileBase,
    );
  }

  function _setUserReviews({
    store,
    userId,
    reviews = [fakeReview],
    count = null,
  }) {
    store.dispatch(
      setUserReviews({
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviewCount: count === null ? reviews.length : count,
        reviews,
        userId,
      }),
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
    const { store } = signInUserWithUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const username = 'i-am-not-tofumatt';

    const root = renderUserProfile({ params: { username }, store });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserAccount({
        errorHandlerId: root.instance().props.errorHandler.id,
        username,
      }),
    );
  });

  it('dispatches fetchUserAccount action if username param changes', () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfile({ params, store });

    dispatchSpy.resetHistory();

    root.setProps({
      match: {
        params: { username: 'killmonger' },
      },
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserAccount({
        errorHandlerId: root.instance().props.errorHandler.id,
        username: 'killmonger',
      }),
    );
  });

  it('does not dispatch fetchUserAccount if username does not change', () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    _setUserReviews({ store, userId: user.id });

    const root = renderUserProfile({ params, store });

    dispatchSpy.resetHistory();

    root.setProps({ params });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders the user avatar', () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const root = renderUserProfile({ params, store });
    const header = getHeaderPropComponent(root);

    expect(header.find(UserAvatar)).toHaveProp(
      'user',
      getCurrentUser(store.getState().users),
    );
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

  it('does not render any tag if user is not a developer or artist', () => {
    const { store } = dispatchSignInActions({
      userProps: defaultUserProps({
        is_addon_developer: false,
        is_artist: false,
      }),
    });
    const root = renderUserProfile({ store });
    const header = getHeaderPropComponent(root);

    expect(header.find('.UserProfile-tags')).toHaveLength(0);
  });

  it('renders the add-ons developer tag if user is a developer', () => {
    const { store } = dispatchSignInActions({
      userProps: defaultUserProps({ is_addon_developer: true }),
    });
    const root = renderUserProfile({ store });
    const header = getHeaderPropComponent(root);

    expect(header.find('.UserProfile-tags')).toHaveLength(1);

    expect(header.find('.UserProfile-developer')).toHaveLength(1);
    expect(header.find('.UserProfile-developer')).toIncludeText(
      'Add-ons developer',
    );
    expect(header.find(Icon)).toHaveLength(1);
    expect(header.find(Icon)).toHaveProp('name', 'developer');
  });

  it('renders the theme artist tag if user is an artist', () => {
    const { store } = dispatchSignInActions({
      userProps: defaultUserProps({ is_artist: true }),
    });
    const root = renderUserProfile({ store });
    const header = getHeaderPropComponent(root);

    expect(header.find('.UserProfile-tags')).toHaveLength(1);

    expect(header.find('.UserProfile-artist')).toHaveLength(1);
    expect(header.find('.UserProfile-artist')).toIncludeText('Theme artist');
    expect(header.find(Icon)).toHaveLength(1);
    expect(header.find(Icon)).toHaveProp('name', 'artist');
  });

  it('renders LoadingText when user name is not ready', () => {
    const root = renderUserProfile({ params: { username: 'not-ready' } });
    const header = getHeaderPropComponent(root);

    expect(header.find('.UserProfile-name').find(LoadingText)).toHaveLength(1);
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
    expect(root.find('.UserProfile-homepage').children()).toHaveText(
      'hamsterdance.com/',
    );
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
    expect(root.find('.UserProfile-occupation').children()).toHaveText(
      occupation,
    );
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
    expect(root.find('.UserProfile-user-since').children()).toHaveText(
      'Aug 15, 2000',
    );
  });

  it('renders LoadingText for account creation date while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-user-since')).toHaveLength(1);
    expect(root.find('.UserProfile-user-since').find(LoadingText)).toHaveLength(
      1,
    );
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
    expect(root.find('.UserProfile-number-of-addons').children()).toHaveText(
      '70',
    );
  });

  it('renders LoadingText for number of add-ons while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-number-of-addons')).toHaveLength(1);
    expect(
      root.find('.UserProfile-number-of-addons').find(LoadingText),
    ).toHaveLength(1);
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
    expect(root.find('.UserProfile-rating-average').find(Rating)).toHaveProp(
      'rating',
      4.1,
    );
  });

  it('renders LoadingText for average add-on rating while loading', () => {
    const root = renderUserProfile({ params: { username: 'not-tofu' } });

    expect(root.find('.UserProfile-rating-average')).toHaveLength(1);
    expect(
      root.find('.UserProfile-rating-average').find(LoadingText),
    ).toHaveLength(1);
  });

  it("renders the user's biography", () => {
    const biography = '<blockquote><b>Not even vegan!</b></blockquote>';

    const { store } = dispatchSignInActions({
      userProps: {
        biography,
        username: 'tofumatt',
      },
    });
    const root = renderUserProfile({ store });

    expect(root.find('.UserProfile-biography')).toHaveLength(1);
    expect(root.find('.UserProfile-biography')).toHaveProp('term', 'Biography');
    expect(
      root
        .find('.UserProfile-biography')
        .find('div')
        .html(),
    ).toContain(biography);
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

  it('passes the errorHandler to the AddonsByAuthorsCard', () => {
    const errorHandler = createStubErrorHandler();
    const root = renderUserProfile({ errorHandler });

    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp(
      'errorHandler',
      errorHandler,
    );
    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp(
      'errorHandler',
      errorHandler,
    );
  });

  it('renders AddonsByAuthorsCard without a user', () => {
    const username = 'not-loaded';
    const root = renderUserProfile({ params: { username } });

    expect(root.find(AddonsByAuthorsCard)).toHaveLength(2);
    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp(
      'authorDisplayName',
      username,
    );
    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp(
      'authorDisplayName',
      username,
    );
  });

  it('renders AddonsByAuthorsCard for extensions', () => {
    const username = 'tofumatt';
    const root = renderUserProfile({ params: { username } });

    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp(
      'addonType',
      ADDON_TYPE_EXTENSION,
    );
    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp(
      'pageParam',
      'page_e',
    );
    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp('paginate', true);
    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp(
      'pathname',
      `/user/${username}/`,
    );
  });

  it('renders AddonsByAuthorsCard for themes', () => {
    const username = 'tofumatt';
    const root = renderUserProfile({ params: { username } });

    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp(
      'addonType',
      ADDON_TYPE_THEME,
    );
    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp(
      'pageParam',
      'page_t',
    );
    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp('paginate', true);
    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp(
      'pathname',
      `/user/${username}/`,
    );
  });

  it('renders a not found page if the API request is a 404', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
    );

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
    expect(root.find('.UserProfile-edit-link')).toHaveProp('to', `/users/edit`);
    expect(root.find('.UserProfile-edit-link').children()).toHaveText(
      'Edit profile',
    );
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
    expect(root.find('.UserProfile-edit-link')).toHaveProp(
      'to',
      `/user/${user.username}/edit/`,
    );
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

  it('fetches reviews if not loaded and username does not change', () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfile({ errorHandler, params, store });

    dispatchSpy.resetHistory();

    root.setProps({ params });

    sinon.assert.calledOnce(dispatchSpy);
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserReviews({
        errorHandlerId: errorHandler.id,
        page: 1,
        userId: user.id,
      }),
    );
  });

  it('fetches reviews if page has changed and username does not change', () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);

    _setUserReviews({ store, userId: user.id });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const location = fakeRouterLocation({ query: { page: 1 } });

    const root = renderUserProfile({
      errorHandler,
      location,
      params,
      store,
    });

    dispatchSpy.resetHistory();

    const newPage = 2;

    root.setProps({
      location: fakeRouterLocation({ query: { page: newPage } }),
      params,
    });

    sinon.assert.calledOnce(dispatchSpy);
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserReviews({
        errorHandlerId: errorHandler.id,
        page: newPage,
        userId: user.id,
      }),
    );
  });

  it('fetches reviews if user is loaded', () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const page = 123;
    const location = fakeRouterLocation({ query: { page } });

    renderUserProfile({ errorHandler, location, params, store });

    sinon.assert.calledOnce(dispatchSpy);
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserReviews({
        errorHandlerId: errorHandler.id,
        page,
        userId: user.id,
      }),
    );
  });

  it('does not fetch reviews if already loaded', () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);

    _setUserReviews({ store, userId: user.id });

    const dispatchSpy = sinon.spy(store, 'dispatch');

    renderUserProfile({ params, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it(`displays the user's reviews`, () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);

    const reviews = [fakeReview];
    _setUserReviews({ store, userId: user.id, reviews });

    const location = fakeRouterLocation({ query: { foo: 'bar' } });

    const root = renderUserProfile({ location, params, store });

    expect(root.find('.UserProfile-reviews')).toHaveLength(1);
    expect(root.find('.UserProfile-reviews')).toHaveProp(
      'header',
      'My reviews',
    );
    expect(root.find('.UserProfile-reviews')).toHaveProp('footer', null);

    expect(root.find(UserReview)).toHaveLength(reviews.length);

    const byLine = shallow(root.find(UserReview).prop('byLine'), {
      // The `Link` component needs the store.
      context: { store },
    });

    expect(byLine).toHaveProp('title', 'Browse the reviews for this add-on');
    expect(byLine).toHaveProp('to', `/addon/${fakeReview.addon.slug}/reviews/`);
    expect(byLine.children()).toHaveText(
      root
        .instance()
        .props.i18n.moment(fakeReview.created)
        .fromNow(),
    );
  });

  it(`displays the user's reviews with pagination when there are more reviews than the default API page size`, () => {
    const { params, store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      store,
      userId: user.id,
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    const location = fakeRouterLocation({ query: { foo: 'bar' } });

    const root = renderUserProfile({ location, params, store });

    const paginator = shallow(root.find('.UserProfile-reviews').prop('footer'));
    expect(paginator.instance()).toBeInstanceOf(Paginate);
    expect(paginator).toHaveProp('count', DEFAULT_API_PAGE_SIZE + 2);
    expect(paginator).toHaveProp('currentPage', 1);
    expect(paginator).toHaveProp('pathname', '/user/black-panther/');
    expect(paginator).toHaveProp('queryParams', location.query);

    expect(root.find(UserReview)).toHaveLength(DEFAULT_API_PAGE_SIZE);
  });

  it(`does not display the user's reviews when current user is not the owner`, () => {
    const username = 'current-logged-in-user';
    const { store } = signInUserWithUsername(username);

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    _setUserReviews({ store, userId: user.id });

    // See this other user profile page.
    const params = { username: user.username };
    const root = renderUserProfile({ params, store });

    expect(root.find('.UserProfile-reviews')).toHaveLength(0);
  });

  it('does not fetch the reviews when user is loaded but current user is not the owner', () => {
    const { store } = signInUserWithUsername('black-panther');

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    const dispatchSpy = sinon.spy(store, 'dispatch');

    // See this other user profile page.
    const params = { username: user.username };
    renderUserProfile({ params, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetch the reviews when page has changed and username does not change but user is not the owner', () => {
    const { store } = signInUserWithUsername('black-panther');

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const location = fakeRouterLocation({ query: { page: 1 } });

    // See this other user profile page.
    const params = { username: user.username };
    const root = renderUserProfile({ location, params, store });

    dispatchSpy.resetHistory();

    const newPage = 2;

    root.setProps({
      location: fakeRouterLocation({ query: { page: newPage } }),
      params,
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('returns a 404 when the API returns a 404', () => {
    const { store } = dispatchSignInActions();

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'internal server error' },
      }),
    );

    const root = renderUserProfile({ errorHandler, store });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders a user profile when URL contains a user ID', () => {
    const { store } = signInUserWithUsername('black-panther');
    const user = getCurrentUser(store.getState().users);

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      store,
      userId: user.id,
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    const root = renderUserProfile({ params: { username: user.id }, store });
    const header = getHeaderPropComponent(root);

    expect(root.find('.UserProfile')).toHaveLength(1);
    expect(header.find('.UserProfile-name')).toHaveText(user.name);

    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp('authorUsernames', [
      user.username,
    ]);
    expect(root.find(AddonsByAuthorsCard).at(0)).toHaveProp(
      'pathname',
      `/user/${user.username}/`,
    );
    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp('authorUsernames', [
      user.username,
    ]);
    expect(root.find(AddonsByAuthorsCard).at(1)).toHaveProp(
      'pathname',
      `/user/${user.username}/`,
    );

    const paginator = shallow(root.find('.UserProfile-reviews').prop('footer'));
    expect(paginator).toHaveProp('pathname', `/user/${user.username}/`);
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on match.params', () => {
      const username = 'foo';
      const params = { username };
      const match = { params };

      expect(extractId({ match })).toEqual(username);
    });
  });
});
