import { waitFor } from '@testing-library/react';

import {
  fetchUserReviews,
  setUserReviews,
  FETCH_USER_REVIEWS,
} from 'amo/actions/reviews';
import { extractId } from 'amo/pages/UserProfile';
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
      username: 'mcdisplayname',
      ...props,
    };
  }

  function signInUserWithProps({ userId = 123, ...props } = {}) {
    dispatchSignInActionsWithStore({
      userId,
      userProps: defaultUserProps({ userId, ...props }),
      store,
    });
    return userId;
  }

  function getLocation({ userId = 100, search = '' } = {}) {
    return `/${lang}/${clientApp}/user/${userId}/${search}`;
  }

  function renderUserProfile({ userId, location } = {}) {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || getLocation({ userId })],
      }),
      store,
    };
    return defaultRender(renderOptions);
  }

  function signInUserAndRenderUserProfile({ userId, ...props } = {}) {
    return renderUserProfile({
      userId: signInUserWithProps({ userId, ...props }),
    });
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

  it('dispatches fetchUserAccount action if userId is not found', () => {
    signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = '200';

    renderUserProfile({ userId });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: createErrorHandlerId({ userId }),
        userId,
      }),
    );
  });

  it('dispatches fetchUserAccount action if userId param changes', () => {
    const firstUserId = signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ userId: firstUserId });

    dispatch.mockClear();

    const secondUserId = 200;
    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ userId: secondUserId }),
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: createErrorHandlerId({ userId: secondUserId }),
        userId: secondUserId,
      }),
    );
  });

  it('does not dispatch fetchUserAccount if userId does not change', () => {
    const userId = signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ userId });

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
    const userId = 100;
    const picture_url = `https://addons.mozilla.org/pictures/${userId}.png`;
    signInUserAndRenderUserProfile({ userId, picture_url });

    expect(screen.getByAltText('User Avatar')).toHaveAttribute(
      'src',
      picture_url,
    );
  });

  it("renders the user's name", () => {
    const name = 'some-user-name';
    signInUserAndRenderUserProfile({ name });

    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  });

  it('does not render any tag if user is not a developer or artist', () => {
    signInUserAndRenderUserProfile({
      is_addon_developer: false,
      is_artist: false,
    });

    expect(screen.queryByText('Add-ons developer')).not.toBeInTheDocument();
    expect(screen.queryByText('Theme artist')).not.toBeInTheDocument();
  });

  it('renders the add-ons developer tag if user is a developer', () => {
    signInUserAndRenderUserProfile({ is_addon_developer: true });

    expect(screen.getByText('Add-ons developer')).toBeInTheDocument();
    expect(screen.getByClassName('Icon-developer')).toBeInTheDocument();
  });

  it('renders the theme artist tag if user is an artist', () => {
    signInUserAndRenderUserProfile({ is_artist: true });

    expect(screen.getByText('Theme artist')).toBeInTheDocument();
    expect(screen.getByClassName('Icon-artist')).toBeInTheDocument();
  });

  it('renders LoadingText when user has not been loaded yet', () => {
    renderUserProfile();

    expect(
      within(screen.getByClassName('UserProfile-name')).getByRole('alert'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByClassName('UserProfile-user-since')).getByRole(
        'alert',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByClassName('UserProfile-number-of-addons')).getByRole(
        'alert',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByClassName(`UserProfile-rating-average`)).getByRole(
        'alert',
      ),
    ).toBeInTheDocument();
  });

  it("renders the user's homepage", () => {
    const homepage = 'http://hamsterdance.com/';
    signInUserAndRenderUserProfile({ homepage });

    expect(screen.getByRole('link', { name: 'Homepage' })).toHaveAttribute(
      'href',
      homepage,
    );
  });

  it("omits homepage if the user doesn't have one set", () => {
    signInUserAndRenderUserProfile({ homepage: null });

    expect(screen.queryByText('Homepage')).not.toBeInTheDocument();
  });

  it("renders the user's occupation", () => {
    const occupation = 'some occupation';
    signInUserAndRenderUserProfile({ occupation });

    expect(screen.getByText('Occupation')).toBeInTheDocument();
    expect(screen.getByText(occupation)).toBeInTheDocument();
  });

  it("omits occupation if the user doesn't have one set", () => {
    signInUserAndRenderUserProfile({
      occupation: null,
    });

    expect(screen.queryByText('Occupation')).not.toBeInTheDocument();
  });

  it("renders the user's location", () => {
    const location = 'some location';
    signInUserAndRenderUserProfile({
      location,
    });

    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText(location)).toBeInTheDocument();
  });

  it("omits location if the user doesn't have one set", () => {
    signInUserAndRenderUserProfile({ location: null });

    expect(screen.queryByText('Location')).not.toBeInTheDocument();
  });

  it("renders the user's account creation date", () => {
    signInUserAndRenderUserProfile({
      created: '2000-08-15T12:01:13Z',
    });

    expect(screen.getByText('User since')).toBeInTheDocument();
    expect(screen.getByText('Aug 15, 2000')).toBeInTheDocument();
  });

  it("renders the user's number of add-ons", () => {
    signInUserAndRenderUserProfile({ num_addons_listed: 70 });

    expect(screen.getByText('Number of add-ons')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it("renders the user's average add-on rating", () => {
    signInUserAndRenderUserProfile({
      average_addon_rating: 3.1,
    });

    expect(
      screen.getByText('Average rating of developer’s add-ons'),
    ).toBeInTheDocument();
    expect(screen.getAllByTitle('Rated 3.1 out of 5')).toHaveLength(6);
  });

  it("renders the user's biography", () => {
    const biographyText = 'Not even vegan!';
    const biography = `<blockquote><b>${biographyText}</b></blockquote>`;
    signInUserAndRenderUserProfile({ biography });

    expect(screen.getByText('Biography')).toBeInTheDocument();
    expect(
      within(screen.getByClassName('UserProfile-biography')).getByTagName(
        'blockquote',
      ),
    ).toHaveTextContent(biographyText);
  });

  it('omits a null biography', () => {
    signInUserAndRenderUserProfile({ biography: null });

    expect(screen.queryByText('Biography')).not.toBeInTheDocument();
  });

  it('omits an empty biography', () => {
    signInUserAndRenderUserProfile({ biography: '' });

    expect(screen.queryByText('Biography')).not.toBeInTheDocument();
  });

  it('does not render a report abuse button if user is the current logged-in user', () => {
    signInUserAndRenderUserProfile();

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
    signInUserWithProps();

    // Create a user with another userId.
    const anotherUserId = 222;
    store.dispatch(
      loadUserAccount({
        user: createUserAccountResponse({ id: anotherUserId }),
      }),
    );

    // See this other user profile page.
    renderUserProfile({ userId: anotherUserId });

    expect(
      screen.getByRole('button', { name: 'Report this user for abuse' }),
    ).toBeInTheDocument();
  });

  it('still renders a report abuse component if user is not loaded', () => {
    renderUserProfile();

    expect(
      screen.getByRole('button', { name: 'Report this user for abuse' }),
    ).toBeInTheDocument();
  });

  it('renders two AddonsByAuthorsCard', () => {
    const userId = 123;
    const user = createUserAccountResponse({ id: userId });
    store.dispatch(loadUserAccount({ user }));

    renderUserProfile({ userId });

    expect(screen.getByText(`Extensions by ${user.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Themes by ${user.name}`)).toBeInTheDocument();
  });

  it('renders AddonsByAuthorsCard for extensions', () => {
    const userId = signInUserWithProps();
    const user = getCurrentUser(store.getState().users);

    renderUserProfile({ userId });

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
    const userId = signInUserWithProps();
    const user = getCurrentUser(store.getState().users);

    renderUserProfile({ userId });

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

    renderUserProfile({ userId });

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

    renderUserProfile({ userId });

    expect(screen.getAllByText(errorString)).toHaveLength(3);
  });

  it('renders an edit link', () => {
    signInUserAndRenderUserProfile();

    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/users/edit`,
    );
  });

  it('does not render an edit link if no user found', () => {
    renderUserProfile();
    expect(
      screen.queryByRole('link', { name: 'Edit profile' }),
    ).not.toBeInTheDocument();
  });

  it('renders an edit link if user has sufficient permission', () => {
    signInUserWithProps({ permissions: [USERS_EDIT] });

    // Create a user with another userId.
    const anotherUserId = 222;
    store.dispatch(
      loadUserAccount({
        user: createUserAccountResponse({ id: anotherUserId }),
      }),
    );

    // See this other user profile page.
    renderUserProfile({ userId: anotherUserId });

    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/user/${anotherUserId}/edit/`,
    );
  });

  it('does not render an edit link if user is not allowed to edit other users', () => {
    signInUserWithProps({ permissions: [] });

    // Create a user with another userId.
    const anotherUserId = 222;
    store.dispatch(
      loadUserAccount({
        user: createUserAccountResponse({ id: anotherUserId }),
      }),
    );

    // See this other user profile page.
    renderUserProfile({ userId: anotherUserId });

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
    signInUserWithProps({ permissions: [USERS_EDIT] });

    renderUserProfile({ userId: 3456 });

    expect(
      screen.queryByRole('link', { name: 'Admin user' }),
    ).not.toBeInTheDocument();
  });

  it('renders an admin link if user has sufficient permission', () => {
    const userId = signInUserWithProps({ permissions: [USERS_EDIT] });

    store.dispatch(
      loadUserAccount({ user: createUserAccountResponse({ userId }) }),
    );

    renderUserProfile({ userId });

    expect(screen.getByRole('link', { name: 'Admin user' })).toHaveAttribute(
      'href',
      `/admin/models/users/userprofile/${userId}/`,
    );
  });

  it('does not render an admin link if user is not allowed to admin users', () => {
    const userId = signInUserWithProps({ permissions: [] });

    store.dispatch(
      loadUserAccount({ user: createUserAccountResponse({ userId }) }),
    );

    renderUserProfile({ userId });

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

    renderUserProfile({ userId });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_ACCOUNT }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it('fetches reviews if not loaded and userId does not change', () => {
    const userId = signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ userId });

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
        userId,
      }),
    );
  });

  it('fetches reviews if page has changed and username does not change', () => {
    const userId = signInUserWithProps();

    _setUserReviews({ store, userId });

    const dispatch = jest.spyOn(store, 'dispatch');
    const location = getLocation({ userId, search: `?page=1` });

    renderUserProfile({ location, userId });

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
        userId,
      }),
    );
  });

  it('fetches reviews if user is loaded', () => {
    const userId = signInUserWithProps();

    const dispatch = jest.spyOn(store, 'dispatch');

    const page = 123;
    const location = getLocation({ userId, search: `?page=${page}` });

    renderUserProfile({ location, userId });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserReviews({
        errorHandlerId: createErrorHandlerId({ userId }),
        page: `${page}`,
        userId,
      }),
    );
  });

  it('does not fetch reviews if already loaded', () => {
    const userId = signInUserWithProps();

    _setUserReviews({ store, userId });

    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ userId });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it(`displays the user's reviews`, () => {
    const userId = signInUserWithProps();

    const review = fakeReview;
    const reviews = [review];
    _setUserReviews({ store, userId, reviews });

    renderUserProfile({ userId });

    expect(screen.getByText('My reviews')).toBeInTheDocument();
    expect(screen.getByText(fakeReview.body)).toBeInTheDocument();
  });

  it(`displays the user's reviews with pagination when there are more reviews than the default API page size`, () => {
    const userId = signInUserWithProps();

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      store,
      userId,
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    renderUserProfile({ userId });

    const paginator = screen.getByClassName('UserProfile-reviews');
    expect(screen.getByText(`Page 1 of 2`)).toBeInTheDocument();
    expect(
      within(paginator).getByRole('link', { name: 'Next' }),
    ).toHaveAttribute('href', getLocation({ userId, search: `?page=2` }));

    expect(screen.queryAllByText('posted')).toHaveLength(DEFAULT_API_PAGE_SIZE);
  });

  it(`does not display the user's reviews when current user is not the owner`, () => {
    const userId = signInUserWithProps();

    // Create a user with another userId.
    const anotherUserId = 222;
    store.dispatch(
      loadUserAccount({
        user: createUserAccountResponse({ id: anotherUserId }),
      }),
    );

    _setUserReviews({ store, userId });

    // See this other user profile page.
    renderUserProfile({ userId: anotherUserId });

    expect(screen.queryByText('My reviews')).not.toBeInTheDocument();
  });

  it('does not fetch the reviews when user is loaded but current user is not the owner', () => {
    signInUserWithProps();

    // Create a user with another userId.
    const anotherUserId = 222;
    store.dispatch(
      loadUserAccount({
        user: createUserAccountResponse({ id: anotherUserId }),
      }),
    );

    const dispatch = jest.spyOn(store, 'dispatch');

    // See this other user profile page.
    renderUserProfile({ userId: anotherUserId });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it('does not fetch the reviews when page has changed and userId does not change but user is not the owner', () => {
    signInUserWithProps();

    // Create a user with another userId.
    const anotherUserId = 222;
    store.dispatch(
      loadUserAccount({
        user: createUserAccountResponse({ id: anotherUserId }),
      }),
    );

    const dispatch = jest.spyOn(store, 'dispatch');
    const location = getLocation({ userId: anotherUserId, search: `?page=1` });

    // See this other user profile page.
    renderUserProfile({ location, userId: anotherUserId });

    dispatch.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ userId: anotherUserId }),
        search: `?page=2`,
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
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

    renderUserProfile({ userId });

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders a user profile when URL contains a user ID', () => {
    const name = 'some user name';
    const userId = signInUserWithProps({ name });

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      userId,
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    renderUserProfile({ userId });

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
      getLocation({ userId, search: `?page=2` }),
    );
  });

  it('renders a UserProfileHead component when user is a developer', async () => {
    const name = 'John Doe';
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: true,
      is_artist: false,
    });

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
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: false,
      is_artist: true,
    });

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
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: true,
      is_artist: true,
    });

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
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: false,
      is_artist: false,
    });

    await waitFor(() => {
      const metaTag = getElements('meta[name="description"]');
      return expect(metaTag).toHaveLength(0);
    });
  });

  it('sets description to `null` to UserProfileHead when there is no user loaded', async () => {
    renderUserProfile({ userId: 1234 });

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

    renderUserProfile({ userId: user.username });

    expect(dispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/user/${user.id}/`,
      }),
    );
  });

  it('sends a server redirect when another user profile is loaded with a "username" in the URL', () => {
    signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    // Create a user with another userId.
    const anotherUserId = 222;
    const user = createUserAccountResponse({ id: anotherUserId });
    store.dispatch(loadUserAccount({ user }));

    dispatch.mockClear();

    renderUserProfile({ userId: user.username });

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

    renderUserProfile({ userId });

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
