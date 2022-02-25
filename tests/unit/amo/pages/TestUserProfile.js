import * as React from 'react';
import { waitFor } from '@testing-library/react';

import {
  fetchUserReviews,
  setUserReviews,
  FETCH_REVIEWS,
  FETCH_USER_REVIEWS,
} from 'amo/actions/reviews';
import UserProfile, { extractId } from 'amo/pages/UserProfile';
import {
  fetchUserAccount,
  getCurrentUser,
  loadUserAccount,
  FETCH_USER_ACCOUNT,
} from 'amo/reducers/users';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'amo/api';
import { CLIENT_APP_FIREFOX, USERS_EDIT } from 'amo/constants';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import {
  createFailedErrorHandler,
  createHistory,
  createUserAccountResponse,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeReview,
  getElement,
  getElements,
  onLocationChanged,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const lang = 'fr';
  const clientApp = CLIENT_APP_FIREFOX;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  function defaultUserProps(props = {}) {
    return {
      display_name: 'Display McDisplayNamey',
      userId: 500,
      username: 'mcdisplayname',
      ...props,
    };
  }

  function signInUserWithProps({ userId = 123, ...props } = {}) {
    store = dispatchSignInActionsWithStore({
      userId,
      userProps: defaultUserProps({ userId, ...props }),
      store,
    }).store;
    return {
      params: { userId },
    };
  }

  function getLocation({
    locale = lang,
    clientApp_ = clientApp,
    userId = 100,
    search = '',
  } = {}) {
    return `/${locale}/${clientApp_}/user/${userId}/${search}`;
  }

  function renderUserProfile({
    params = { userId: 100 },
    location,
    ...props
  } = {}) {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || getLocation({ userId: params.userId })],
      }),
      store,
    };
    return defaultRender(<UserProfile {...props} />, renderOptions);
  }

  function _setUserReviews({ userId, reviews = [fakeReview], count = null }) {
    store.dispatch(
      setUserReviews({
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviewCount: count === null ? reviews.length : count,
        reviews,
        userId,
      }),
    );
  }

  const createErrorHandlerId = ({ userId = null }) => {
    return `src/amo/pages/UserProfile/index.js-${extractId({
      match: { params: { userId } },
    })}`;
  };

  it('renders user profile page', () => {
    renderUserProfile();

    expect(screen.getByClassName('UserProfile')).toBeInTheDocument();
  });

  it('dispatches fetchUserAccount action if userId is not found', () => {
    signInUserWithProps({ userId: 100 });
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = '200';

    renderUserProfile({ params: { userId } });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: createErrorHandlerId({ userId }),
        userId,
      }),
    );
  });

  it('dispatches fetchUserAccount action if userId param changes', () => {
    const { params } = signInUserWithProps({ userId: 100 });
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ params });

    dispatch.mockClear();

    const userId = 200;
    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ userId }),
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: createErrorHandlerId({ userId }),
        userId,
      }),
    );
  });

  it('does not dispatch fetchUserAccount if userId does not change', () => {
    const userId = 100;
    const { params } = signInUserWithProps({ userId });
    const user = getCurrentUser(store.getState().users);
    const dispatch = jest.spyOn(store, 'dispatch');

    _setUserReviews({ userId: user.id });

    renderUserProfile({ params });

    dispatch.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ userId }),
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_ACCOUNT }),
    );
  });

  it('renders the user avatar', () => {
    const picture_url = 'https://addons.mozilla.org/pictures/100.png';
    const { params } = signInUserWithProps({ userId: 100, picture_url });
    renderUserProfile({ params });

    expect(screen.getByAltText('User Avatar')).toHaveAttribute(
      'src',
      picture_url,
    );
  });

  it("renders the user's name", () => {
    const name = 'some-user-name';
    const { params } = signInUserWithProps({ name });

    renderUserProfile({ params });

    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  });

  it('does not render any tag if user is not a developer or artist', () => {
    const { params } = signInUserWithProps({
      is_addon_developer: false,
      is_artist: false,
    });

    renderUserProfile({ params });

    expect(screen.queryByClassName('UserProfile-tags')).not.toBeInTheDocument();
  });

  it('renders the add-ons developer tag if user is a developer', () => {
    const { params } = signInUserWithProps({ is_addon_developer: true });

    renderUserProfile({ params });

    expect(screen.getByClassName('UserProfile-tags')).toBeInTheDocument();

    expect(screen.getByText('Add-ons developer')).toBeInTheDocument();
    expect(screen.getByClassName('Icon-developer')).toBeInTheDocument();
  });

  it('renders the theme artist tag if user is an artist', () => {
    const { params } = signInUserWithProps({ is_artist: true });

    renderUserProfile({ params });

    expect(screen.getByClassName('UserProfile-tags')).toBeInTheDocument();

    expect(screen.getByText('Theme artist')).toBeInTheDocument();
    expect(screen.getByClassName('Icon-artist')).toBeInTheDocument();
  });

  it('renders LoadingText when user has not been loaded yet', () => {
    renderUserProfile({ params: { userId: 666 } });

    expect(
      within(screen.getByClassName('UserProfile-name')).getByClassName(
        'LoadingText',
      ),
    ).toBeInTheDocument();
  });

  it("renders the user's homepage", () => {
    const homepage = 'http://hamsterdance.com/';
    const { params } = signInUserWithProps({ homepage });

    renderUserProfile({ params });

    const link = screen.getByRole('link', { name: 'Homepage' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', homepage);
  });

  it("omits homepage if the user doesn't have one set", () => {
    const { params } = signInUserWithProps({ homepage: null });

    renderUserProfile({ params });

    expect(screen.queryByText('Homepage')).not.toBeInTheDocument();
  });

  it("renders the user's occupation", () => {
    const occupation = 'some occupation';
    const { params } = signInUserWithProps({ occupation });

    renderUserProfile({ params });

    expect(screen.getByText('Occupation')).toBeInTheDocument();
    expect(screen.getByText(occupation)).toBeInTheDocument();
  });

  it("omits occupation if the user doesn't have one set", () => {
    const { params } = signInUserWithProps({
      occupation: null,
    });

    renderUserProfile({ params });

    expect(screen.queryByText('Occupation')).not.toBeInTheDocument();
  });

  it("renders the user's location", () => {
    const location = 'some location';
    const { params } = signInUserWithProps({
      location,
    });

    renderUserProfile({ params });

    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText(location)).toBeInTheDocument();
  });

  it("omits location if the user doesn't have one set", () => {
    const { params } = signInUserWithProps({ location: null });

    renderUserProfile({ params });

    expect(screen.queryByText('Occupation')).not.toBeInTheDocument();
  });

  it("renders the user's account creation date", () => {
    const { params } = signInUserWithProps({
      created: '2000-08-15T12:01:13Z',
    });

    renderUserProfile({ params });

    expect(screen.getByText('User since')).toBeInTheDocument();
    expect(screen.getByText('Aug 15, 2000')).toBeInTheDocument();
  });

  it('renders LoadingText for account creation date while loading', () => {
    renderUserProfile({ params: { userId: 1234 } });

    expect(screen.getByText('User since')).toBeInTheDocument();
    expect(
      within(screen.getByClassName('UserProfile-user-since')).getByClassName(
        'LoadingText',
      ),
    ).toBeInTheDocument();
  });

  it("renders the user's number of add-ons", () => {
    const { params } = signInUserWithProps({ num_addons_listed: 70 });

    renderUserProfile({ params });

    expect(screen.getByText('Number of add-ons')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('renders LoadingText for number of add-ons while loading', () => {
    renderUserProfile({ params: { userId: 1234 } });

    expect(screen.getByText('Number of add-ons')).toBeInTheDocument();
    expect(
      within(
        screen.getByClassName('UserProfile-number-of-addons'),
      ).getByClassName('LoadingText'),
    ).toBeInTheDocument();
  });

  it("renders the user's average add-on rating", () => {
    const { params } = signInUserWithProps({
      average_addon_rating: 3.1,
    });

    renderUserProfile({ params });

    expect(
      screen.getByText('Average rating of developer’s add-ons'),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByClassName('UserProfile-rating-average'),
      ).getByClassName('Rating'),
    ).toHaveAttribute('title', 'Rated 3.1 out of 5');
  });

  it('renders LoadingText for average add-on rating while loading', () => {
    renderUserProfile({ params: { userId: 1234 } });

    expect(
      screen.getByText('Average rating of developer’s add-ons'),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByClassName('UserProfile-rating-average'),
      ).getByClassName('LoadingText'),
    ).toBeInTheDocument();
  });

  it("renders the user's biography", () => {
    const biographyText = 'Not even vegan!';
    const biography = `<blockquote><b>${biographyText}</b></blockquote>`;
    const { params } = signInUserWithProps({ biography });

    renderUserProfile({ params });

    expect(screen.getByText('Biography')).toBeInTheDocument();
    expect(
      within(screen.getByClassName('UserProfile-biography')).getByTagName(
        'blockquote',
      ),
    ).toBeInTheDocument();
  });

  it('omits a null biography', () => {
    const { params } = signInUserWithProps({ biography: null });

    renderUserProfile({ params });

    expect(screen.queryByText('Biography')).not.toBeInTheDocument();
  });

  it('omits an empty biography', () => {
    const { params } = signInUserWithProps({ biography: '' });

    renderUserProfile({ params });

    expect(screen.queryByText('Biography')).not.toBeInTheDocument();
  });

  it('does not render a report abuse button if user is the current logged-in user', () => {
    signInUserWithProps({ userId: 100 });
    renderUserProfile();

    expect(
      screen.queryByRole('button', { name: 'Report this user for abuse' }),
    ).not.toBeInTheDocument();
  });

  it('renders a report abuse button if user is not logged-in', () => {
    renderUserProfile();

    expect(
      screen.getByRole('button', { name: 'Report this user for abuse' }),
    ).toBeInTheDocument();
  });

  it('renders a report abuse button if user is not the current logged-in user', () => {
    const userId = 1;
    signInUserWithProps({ userId });

    // Create a user with another userId.
    const user = createUserAccountResponse({ id: 222 });
    store.dispatch(loadUserAccount({ user }));

    // See this other user profile page.
    const params = { userId: user.id };
    renderUserProfile({ params });

    expect(
      screen.getByRole('button', { name: 'Report this user for abuse' }),
    ).toBeInTheDocument();
  });

  it('still renders a report abuse component if user is not loaded', () => {
    // The ReportUserAbuse handles an empty `user` object so we should
    // always pass the `user` prop to it.
    renderUserProfile({ params: { userId: 123 } });

    expect(
      screen.getByRole('button', { name: 'Report this user for abuse' }),
    ).toBeInTheDocument();
  });

  it('renders two AddonsByAuthorsCard', () => {
    renderUserProfile();

    expect(screen.queryAllByClassName('AddonsByAuthorsCard')).toHaveLength(2);
  });

  it('renders AddonsByAuthorsCards without a user', () => {
    const userId = 1234;
    renderUserProfile({ params: { userId } });

    expect(screen.queryAllByClassName('AddonsByAuthorsCard')).toHaveLength(2);
  });

  it('renders AddonsByAuthorsCard for extensions', () => {
    const userId = 123;
    const { params } = signInUserWithProps({ userId });
    const user = getCurrentUser(store.getState().users);

    renderUserProfile({ params });

    expect(screen.getByText(`Extensions by ${user.name}`)).toBeInTheDocument();
    const extensionCard = screen
      .queryAllByClassName('AddonsByAuthorsCard')
      .item(0);
    expect(
      within(extensionCard).queryByText('Previous'),
    ).not.toBeInTheDocument();
    expect(within(extensionCard).queryByText('Next')).not.toBeInTheDocument();
  });

  it('renders AddonsByAuthorsCard for themes', () => {
    const userId = 123;
    const { params } = signInUserWithProps({ userId });
    const user = getCurrentUser(store.getState().users);

    renderUserProfile({ params });

    expect(screen.getByText(`Themes by ${user.name}`)).toBeInTheDocument();
    const themeCard = screen.queryAllByClassName('AddonsByAuthorsCard').item(1);
    expect(screen.queryByText(themeCard, 'Previous')).not.toBeInTheDocument();
    expect(screen.queryByText(themeCard, 'Next')).not.toBeInTheDocument();
  });

  it('renders a not found page if the API request is a 404', () => {
    const userId = 123;
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
      id: createErrorHandlerId({ userId }),
      store,
    });

    renderUserProfile({ params: { userId } });

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders errors', () => {
    const userId = 123;
    const errorString = 'unexpected error';
    createFailedErrorHandler({
      error: new Error(),
      id: createErrorHandlerId({ userId }),
      message: errorString,
      store,
    });

    renderUserProfile({ params: { userId } });

    expect(screen.getAllByText(errorString)).not.toHaveLength(0);
  });

  it('renders an edit link', () => {
    signInUserWithProps({ userId: 100 });
    renderUserProfile();

    const editButton = screen.getByRole('link', { name: 'Edit profile' });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/users/edit`,
    );
  });

  it('does not render an edit link if no user found', () => {
    renderUserProfile({ params: { userId: 1234 } });
    expect(
      screen.queryByRole('link', { name: 'Edit profile' }),
    ).not.toBeInTheDocument();
  });

  it('renders an edit link if user has sufficient permission', () => {
    signInUserWithProps({
      userId: 1,
      permissions: [USERS_EDIT],
    });

    // Create a user with another userId.
    const user = createUserAccountResponse({ id: 2 });
    store.dispatch(loadUserAccount({ user }));

    // See this other user profile page.
    const params = { userId: user.id };
    renderUserProfile({ params });

    const editButton = screen.getByRole('link', { name: 'Edit profile' });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/user/${user.id}/edit/`,
    );
  });

  it('does not render an edit link if user is not allowed to edit other users', () => {
    signInUserWithProps({
      userId: 1,
      permissions: [],
    });

    // Create a user with another userId.
    const user = createUserAccountResponse({ id: 2 });
    store.dispatch(loadUserAccount({ user }));

    // See this other user profile page.
    const params = { userId: user.id };
    renderUserProfile({ params });

    expect(
      screen.queryByRole('link', { name: 'Edit profile' }),
    ).not.toBeInTheDocument();
  });

  it('does not render an admin link if the user is not logged in', () => {
    renderUserProfile();

    expect(
      screen.queryByRole('link', { name: 'Admin user' }),
    ).not.toBeInTheDocument();
  });

  it('does not render an admin link if no user is found', () => {
    signInUserWithProps({
      userId: 1,
      permissions: [USERS_EDIT],
    });

    renderUserProfile({
      params: { userId: 3456 },
    });

    expect(
      screen.queryByRole('link', { name: 'Admin user' }),
    ).not.toBeInTheDocument();
  });

  it('renders an admin link if user has sufficient permission', () => {
    const userId = 1;
    signInUserWithProps({
      userId,
      permissions: [USERS_EDIT],
    });

    const user = createUserAccountResponse({ userId });
    store.dispatch(loadUserAccount({ user }));

    renderUserProfile({ params: { userId } });

    const adminButton = screen.getByRole('link', { name: 'Admin user' });
    expect(adminButton).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin user' })).toHaveAttribute(
      'href',
      `/admin/models/users/userprofile/${userId}/`,
    );
  });

  it('does not render an admin link if user is not allowed to admin users', () => {
    const userId = 1;
    signInUserWithProps({
      userId,
      permissions: [],
    });

    const user = createUserAccountResponse({ userId });
    store.dispatch(loadUserAccount({ user }));

    renderUserProfile({ params: { userId } });

    expect(
      screen.queryByRole('link', { name: 'Admin user' }),
    ).not.toBeInTheDocument();
  });

  it('does not dispatch any user actions when there is an error', () => {
    const dispatch = jest.spyOn(store, 'dispatch');

    const userId = 123;
    createFailedErrorHandler({
      error: new Error(),
      id: createErrorHandlerId({ userId }),
      message: 'unexpected error',
      store,
    });

    renderUserProfile({ params: { userId } });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_ACCOUNT }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_REVIEWS }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it('fetches reviews if not loaded and userId does not change', () => {
    const userId = 100;
    const { params } = signInUserWithProps({ userId });
    const user = getCurrentUser(store.getState().users);
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ params });

    dispatch.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ userId }),
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserReviews({
        errorHandlerId: createErrorHandlerId({ userId }),
        page: '1',
        userId: user.id,
      }),
    );
  });

  it('fetches reviews if page has changed and username does not change', () => {
    const userId = 100;
    const { params } = signInUserWithProps({ userId });
    const user = getCurrentUser(store.getState().users);

    _setUserReviews({ store, userId: user.id });

    const dispatch = jest.spyOn(store, 'dispatch');
    const location = getLocation({ userId, search: `?page=1` });

    renderUserProfile({
      location,
      params,
      store,
    });

    dispatch.mockClear();

    const newPage = '2';

    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ userId }),
        search: `?page=${newPage}`,
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserReviews({
        errorHandlerId: createErrorHandlerId({ userId }),
        page: newPage,
        userId: user.id,
      }),
    );
  });

  it('fetches reviews if user is loaded', () => {
    const userId = 100;
    const { params } = signInUserWithProps({ userId });
    const user = getCurrentUser(store.getState().users);

    const dispatch = jest.spyOn(store, 'dispatch');

    const page = 123;
    const location = getLocation({ userId, search: `?page=${page}` });

    renderUserProfile({ location, params });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserReviews({
        errorHandlerId: createErrorHandlerId({ userId }),
        page: `${page}`,
        userId: user.id,
      }),
    );
  });

  it('does not fetch reviews if already loaded', () => {
    const { params } = signInUserWithProps({ userId: 100 });
    const user = getCurrentUser(store.getState().users);

    _setUserReviews({ store, userId: user.id });

    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ params });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_REVIEWS }),
    );
  });

  it(`displays the user's reviews`, () => {
    const userId = 100;
    const { params } = signInUserWithProps({ userId });

    const review = fakeReview;
    const reviews = [review];
    _setUserReviews({ store, userId, reviews });

    renderUserProfile({ params });

    expect(screen.getByText('My reviews')).toBeInTheDocument();
    expect(screen.getByText('It is Okay')).toBeInTheDocument();
  });

  it(`displays the user's reviews with pagination when there are more reviews than the default API page size`, () => {
    const userId = 100;
    const { params } = signInUserWithProps({ userId });

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      store,
      userId,
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    renderUserProfile({ params });

    const paginator = screen.getByClassName('UserProfile-reviews');
    expect(paginator).toBeInTheDocument();
    expect(screen.getByText(`Page 1 of 2`)).toBeInTheDocument();
    expect(within(paginator).getByText('Next')).toHaveAttribute(
      'href',
      getLocation({ userId, search: `?page=2` }),
    );

    expect(screen.queryAllByText('posted')).toHaveLength(DEFAULT_API_PAGE_SIZE);
  });

  it(`does not display the user's reviews when current user is not the owner`, () => {
    const userId = 100;
    signInUserWithProps({ userId });

    // Create a user with another userId.
    const user = createUserAccountResponse({ id: 2 });
    store.dispatch(loadUserAccount({ user }));

    _setUserReviews({ store, userId });

    // See this other user profile page.
    const params = { userId: user.id };
    renderUserProfile({ params });

    expect(screen.queryByText('My reviews')).not.toBeInTheDocument();
    expect(screen.queryByText('It is Okay')).not.toBeInTheDocument();
  });

  it('does not fetch the reviews when user is loaded but current user is not the owner', () => {
    signInUserWithProps({ userId: 100 });

    // Create a user with another userId.
    const user = createUserAccountResponse({ id: 2 });
    store.dispatch(loadUserAccount({ user }));

    const dispatch = jest.spyOn(store, 'dispatch');

    // See this other user profile page.
    const params = { userId: user.id };
    renderUserProfile({ params, store });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_REVIEWS }),
    );
  });

  it('does not fetch the reviews when page has changed and userId does not change but user is not the owner', () => {
    signInUserWithProps({ userId: 100 });

    // Create a user with another userId.
    const user = createUserAccountResponse({ id: 2 });
    store.dispatch(loadUserAccount({ user }));

    const dispatch = jest.spyOn(store, 'dispatch');
    const params = { userId: user.id };
    const location = getLocation({ ...params, search: `?page=1` });

    // See this other user profile page.
    renderUserProfile({ location, params });

    dispatch.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(params),
        search: `?page=2`,
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_REVIEWS }),
    );
  });

  it('returns a 404 when the API returns a 404', () => {
    const userId = 123;
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
      id: createErrorHandlerId({ userId }),
      store,
    });

    renderUserProfile({ params: { userId } });

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders a user profile when URL contains a user ID', () => {
    const userId = 100;
    const name = 'some user name';
    const { params } = signInUserWithProps({ userId, name });

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      userId,
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    renderUserProfile({ params });

    expect(screen.getByClassName('UserProfile')).toBeInTheDocument();

    expect(screen.getByText(`Extensions by ${name}`)).toBeInTheDocument();
    const extensionCard = screen
      .queryAllByClassName('AddonsByAuthorsCard')
      .item(0);
    expect(
      within(extensionCard).queryByText('Previous'),
    ).not.toBeInTheDocument();
    expect(within(extensionCard).queryByText('Next')).not.toBeInTheDocument();

    expect(screen.getByText(`Themes by ${name}`)).toBeInTheDocument();
    const themeCard = screen.queryAllByClassName('AddonsByAuthorsCard').item(1);
    expect(within(themeCard).queryByText('Previous')).not.toBeInTheDocument();
    expect(within(themeCard).queryByText('Next')).not.toBeInTheDocument();

    expect(screen.getByText('Next')).toHaveAttribute(
      'href',
      getLocation({ search: `?page=2` }),
    );
  });

  it('renders a UserProfileHead component when user is a developer', async () => {
    const name = 'John Doe';
    const { params } = signInUserWithProps({
      name,
      is_addon_developer: true,
      is_artist: false,
    });

    renderUserProfile({ params });

    let metaTag;

    await waitFor(() => {
      metaTag = getElement('meta[name="description"]');
      return expect(metaTag).toBeInTheDocument();
    });

    expect(metaTag).toHaveAttribute(
      'content',
      `The profile of ${name}, Firefox extension author. Find other extensions by ${name}, including average ratings, tenure, and the option to report issues.`,
    );
  });

  it('renders a UserProfileHead component when user is an artist', async () => {
    const name = 'John Doe';
    const { params } = signInUserWithProps({
      name,
      is_addon_developer: false,
      is_artist: true,
    });

    renderUserProfile({ params });

    let metaTag;

    await waitFor(() => {
      metaTag = getElement('meta[name="description"]');
      return expect(metaTag).toBeInTheDocument();
    });

    expect(metaTag).toHaveAttribute(
      'content',
      `The profile of ${name}, Firefox theme author. Find other themes by ${name}, including average ratings, tenure, and the option to report issues.`,
    );
  });

  it('renders a UserProfileHead component when user is a developer and an artist', async () => {
    const name = 'John Doe';
    const { params } = signInUserWithProps({
      name,
      is_addon_developer: true,
      is_artist: true,
    });

    renderUserProfile({ params });

    let metaTag;

    await waitFor(() => {
      metaTag = getElement('meta[name="description"]');
      return expect(metaTag).toBeInTheDocument();
    });

    expect(metaTag).toHaveAttribute(
      'content',
      `The profile of ${name}, a Firefox extension and theme author. Find other apps by ${name}, including average ratings, tenure, and the option to report issues.`,
    );
  });

  it('sets the description to `null` to UserProfileHead when user is neither a developer nor an artist', async () => {
    const name = 'John Doe';
    const { params } = signInUserWithProps({
      name,
      is_addon_developer: false,
      is_artist: false,
    });

    renderUserProfile({ params });

    await waitFor(() => {
      const metaTag = getElements('meta[name="description"]');
      return expect(metaTag).toHaveLength(0);
    });
  });

  it('sets description to `null` to UserProfileHead when there is no user loaded', async () => {
    renderUserProfile({ params: { userId: 1234 } });

    await waitFor(() => {
      const metaTag = getElements('meta[name="description"]');
      return expect(metaTag).toHaveLength(0);
    });
  });

  it('sends a server redirect when the current user loads their profile with their "username" in the URL', () => {
    signInUserWithProps();
    const user = getCurrentUser(store.getState().users);

    const dispatch = jest.spyOn(store, 'dispatch');
    dispatch.mockClear();

    renderUserProfile({ params: { userId: user.username } });

    expect(dispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/user/${user.id}/`,
      }),
    );
  });

  it('sends a server redirect when another user profile is loaded with a "username" in the URL', () => {
    const userId = 1;
    signInUserWithProps({ userId });
    const dispatch = jest.spyOn(store, 'dispatch');

    // Create a user with another userId.
    const anotherUserId = 222;
    const user = createUserAccountResponse({ id: anotherUserId });
    store.dispatch(loadUserAccount({ user }));

    dispatch.mockClear();

    renderUserProfile({ params: { userId: user.username } });

    expect(dispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/user/${anotherUserId}/`,
      }),
    );
  });

  it('dispatches an action to fetch a user profile by username', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = 'this-is-a-username';

    renderUserProfile({ params: { userId } });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: createErrorHandlerId({ userId }),
        userId: `${userId}`,
      }),
    );
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on match.params', () => {
      const userId = 123;
      const params = { userId };
      const match = { params };

      expect(extractId({ match })).toEqual(userId);
    });
  });
});
