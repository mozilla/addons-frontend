import config from 'config';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  fetchUserReviews,
  setUserReviews,
  FETCH_USER_REVIEWS,
} from 'amo/actions/reviews';
import createLocalState from 'amo/localState';
import { extractId } from 'amo/pages/UserProfile';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  FETCH_ADDONS_BY_AUTHORS,
  THEMES_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import {
  hideUserAbuseReportUI,
  loadUserAbuseReport,
  sendUserAbuseReport,
  showUserAbuseReportUI,
} from 'amo/reducers/userAbuseReports';
import {
  fetchUserAccount,
  getCurrentUser,
  loadUserAccount,
  FETCH_USER_ACCOUNT,
} from 'amo/reducers/users';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'amo/api';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  API_ERROR_AUTHENTICATION_EXPIRED,
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_POPULAR,
  USERS_EDIT,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import {
  changeLocation,
  createFailedErrorHandler,
  createFakeUserAbuseReport,
  createUserAccountResponse,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAuthors,
  fakeReview,
  getElement,
  getElements,
  getMockConfig,
  loadAddonsByAuthors,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';
import { setViewContext } from 'amo/actions/viewContext';

jest.mock('amo/localState', () =>
  jest.fn(() => {
    return {
      save: jest.fn(() => {
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        return Promise.resolve();
      }),
      load: jest.fn(() => {
        return Promise.resolve(null);
      }),
    };
  }),
);

jest.mock('config');

describe(__filename, () => {
  const lang = 'fr';
  const clientApp = CLIENT_APP_FIREFOX;
  let history;
  let store;
  const defaultUserId = fakeAuthors[0].id;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
    const fakeConfig = getMockConfig({ enableFeatureFeedbackFormLinks: false });
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  function defaultUserProps(props = {}) {
    return {
      display_name: 'Display McDisplayNamey',
      username: 'mcdisplayname',
      ...props,
    };
  }

  function signInUserWithProps({ userId = defaultUserId, ...props } = {}) {
    dispatchSignInActionsWithStore({
      userId,
      userProps: defaultUserProps(props),
      store,
    });
    return userId;
  }

  function getLocation({ userId = defaultUserId, search = '' } = {}) {
    return `/${lang}/${clientApp}/user/${userId}/${search}`;
  }

  function renderUserProfile({ userId = defaultUserId, location } = {}) {
    const renderOptions = {
      initialEntries: [location || getLocation({ userId })],
      store,
    };
    const renderResults = defaultRender(renderOptions);
    history = renderResults.history;
    return renderResults;
  }

  function signInUserAndRenderUserProfile({
    userId = defaultUserId,
    ...props
  } = {}) {
    return renderUserProfile({
      userId: signInUserWithProps({ userId, ...props }),
    });
  }

  function _setUserReviews({
    userId = defaultUserId,
    reviews = [fakeReview],
    count = null,
  } = {}) {
    store.dispatch(
      setUserReviews({
        pageSize: DEFAULT_API_PAGE_SIZE,
        reviewCount: count === null ? reviews.length : count,
        reviews,
        userId,
      }),
    );
  }

  function renderForOtherThanSignedInUser() {
    const userId = signInUserWithProps();

    // Create a user with another userId.
    const anotherUserId = userId + 1;
    store.dispatch(
      loadUserAccount({
        user: createUserAccountResponse({ id: anotherUserId }),
      }),
    );

    // See this other user profile page.
    renderUserProfile({ userId: anotherUserId });
    return anotherUserId;
  }

  const createErrorHandlerId = ({ userId = defaultUserId } = {}) => {
    return `src/amo/pages/UserProfile/index.js-${extractId({
      match: { params: { userId } },
    })}`;
  };

  it('dispatches fetchUserAccount action if userId is not found', async () => {
    const userId = signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');
    const notFoundUserId = userId + 1;

    renderUserProfile({ userId: notFoundUserId });

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        fetchUserAccount({
          errorHandlerId: createErrorHandlerId({ userId: notFoundUserId }),
          userId: String(notFoundUserId),
        }),
      ),
    );
  });

  it('dispatches fetchUserAccount action if userId param changes', async () => {
    const userId = signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile({ userId });

    dispatch.mockClear();

    const secondUserId = userId + 1;

    await changeLocation({
      history,
      pathname: getLocation({ userId: secondUserId }),
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: createErrorHandlerId({ userId: secondUserId }),
        userId: secondUserId,
      }),
    );
  });

  it('does not dispatch fetchUserAccount if userId does not change', async () => {
    signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile();

    dispatch.mockClear();

    await changeLocation({
      history,
      pathname: getLocation(),
    });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_ACCOUNT }),
    );
  });

  it('renders the user avatar', () => {
    const pictureUrl = `https://addons.mozilla.org/pictures/${defaultUserId}.png`;
    signInUserAndRenderUserProfile({ picture_url: pictureUrl });

    expect(screen.getByAltText('User Avatar')).toHaveAttribute(
      'src',
      pictureUrl,
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
    const user = createUserAccountResponse({ id: defaultUserId });
    store.dispatch(loadUserAccount({ user }));
    renderUserProfile();

    expect(
      screen.getByRole('button', { name: 'Report this user for abuse' }),
    ).toBeInTheDocument();
  });

  it('renders a report abuse button if user is not the current logged-in user', () => {
    renderForOtherThanSignedInUser();

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
    const user = createUserAccountResponse({ id: defaultUserId });
    store.dispatch(loadUserAccount({ user }));

    renderUserProfile();

    expect(screen.getByText(`Extensions by ${user.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Themes by ${user.name}`)).toBeInTheDocument();
  });

  it('renders a not found page if the API request is a 404', () => {
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
      id: createErrorHandlerId(),
      store,
    });

    renderUserProfile();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders errors', () => {
    const errorString = 'unexpected error';
    createFailedErrorHandler({
      error: new Error(),
      id: createErrorHandlerId(),
      message: errorString,
      store,
    });

    renderUserProfile();

    expect(screen.getAllByText(errorString)).toHaveLength(3);
  });

  it('shows Login Expired if api returns 401 auth expired', async () => {
    signInUserAndRenderUserProfile();

    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/users/edit`,
    );

    createFailedErrorHandler({
      error: createApiError({
        response: { status: 401 },
        jsonResponse: {
          code: API_ERROR_AUTHENTICATION_EXPIRED,
        },
      }),
      id: createErrorHandlerId(),
      store,
    });

    expect(await screen.findByText('Login Expired')).toBeInTheDocument();
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
    const userId = signInUserWithProps({ permissions: [USERS_EDIT] });

    // Create a user with another userId.
    const anotherUserId = userId + 1;
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
    const userId = signInUserWithProps({ permissions: [] });

    // Create a user with another userId.
    const anotherUserId = userId + 1;
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
    const userId = signInUserWithProps({ permissions: [USERS_EDIT] });

    renderUserProfile({ userId: userId + 1 });

    expect(
      screen.queryByRole('link', { name: 'Admin user' }),
    ).not.toBeInTheDocument();
  });

  it('renders an admin link if user has sufficient permission', () => {
    const userId = signInUserWithProps({ permissions: [USERS_EDIT] });

    renderUserProfile({ userId });

    expect(screen.getByRole('link', { name: 'Admin user' })).toHaveAttribute(
      'href',
      `/admin/models/users/userprofile/${userId}/`,
    );
  });

  it('does not render an admin link if user is not allowed to admin users', () => {
    signInUserWithProps({ permissions: [] });

    renderUserProfile();

    expect(
      screen.queryByRole('link', { name: 'Admin user' }),
    ).not.toBeInTheDocument();
  });

  it('does not dispatch any user actions when there is an error', () => {
    const dispatch = jest.spyOn(store, 'dispatch');

    createFailedErrorHandler({
      error: new Error(),
      id: createErrorHandlerId(),
      message: 'unexpected error',
      store,
    });

    renderUserProfile();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_ACCOUNT }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it('fetches reviews if not loaded and userId does not change', async () => {
    signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile();

    dispatch.mockClear();

    await changeLocation({
      history,
      pathname: getLocation(),
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserReviews({
        errorHandlerId: createErrorHandlerId(),
        page: '1',
        userId: defaultUserId,
      }),
    );
  });

  it('fetches reviews if page has changed and username does not change', async () => {
    signInUserWithProps();

    _setUserReviews();

    const dispatch = jest.spyOn(store, 'dispatch');
    const location = getLocation({ search: `?page=1` });

    renderUserProfile({ location });

    dispatch.mockClear();

    const newPage = '2';

    await changeLocation({
      history,
      pathname: getLocation(),
      search: `?page=${newPage}`,
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserReviews({
        errorHandlerId: createErrorHandlerId(),
        page: newPage,
        userId: defaultUserId,
      }),
    );
  });

  it('fetches reviews if user is loaded', () => {
    signInUserWithProps();

    const dispatch = jest.spyOn(store, 'dispatch');

    const page = '123';
    const location = getLocation({ search: `?page=${page}` });

    renderUserProfile({ location });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserReviews({
        errorHandlerId: createErrorHandlerId(),
        page,
        userId: defaultUserId,
      }),
    );
  });

  it('does not fetch reviews if already loaded', () => {
    signInUserWithProps();

    _setUserReviews();

    const dispatch = jest.spyOn(store, 'dispatch');

    renderUserProfile();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it(`displays the user's reviews`, () => {
    signInUserWithProps();

    const review = fakeReview;
    const reviews = [review];
    _setUserReviews({ reviews });

    renderUserProfile();

    expect(screen.getByText('My reviews')).toBeInTheDocument();
    expect(screen.getByText(fakeReview.body)).toBeInTheDocument();

    const paginator = screen.getByClassName('UserProfile-reviews');
    expect(
      within(paginator).queryByRole('link', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it(`displays the user's reviews with pagination when there are more reviews than the default API page size`, () => {
    signInUserWithProps();

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    renderUserProfile();

    const paginator = screen.getByClassName('UserProfile-reviews');
    expect(screen.getByText(`Page 1 of 2`)).toBeInTheDocument();
    expect(
      within(paginator).getByRole('link', { name: 'Next' }),
    ).toHaveAttribute('href', getLocation({ search: `?page=2` }));

    expect(screen.queryAllByText('posted')).toHaveLength(DEFAULT_API_PAGE_SIZE);
  });

  it(`does not display the user's reviews when current user is not the owner`, () => {
    renderForOtherThanSignedInUser();

    expect(screen.queryByText('My reviews')).not.toBeInTheDocument();
  });

  it('does not fetch the reviews when user is loaded but current user is not the owner', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderForOtherThanSignedInUser();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it('does not fetch the reviews when page has changed and userId does not change but user is not the owner', async () => {
    const userId = signInUserWithProps();

    // Create a user with another userId.
    const anotherUserId = userId + 1;
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

    await changeLocation({
      history,
      pathname: getLocation({ userId: anotherUserId }),
      search: '?page=2',
    });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'type': FETCH_USER_REVIEWS }),
    );
  });

  it('renders a user profile when URL contains a user ID', () => {
    const name = 'some name';
    signInUserWithProps({ name });

    const reviews = Array(DEFAULT_API_PAGE_SIZE).fill(fakeReview);
    _setUserReviews({
      reviews,
      count: DEFAULT_API_PAGE_SIZE + 2,
    });

    renderUserProfile();
    expect(
      within(screen.getByClassName('UserProfile')).getByText(name),
    ).toBeInTheDocument();

    expect(screen.getByText(`Extensions by ${name}`)).toBeInTheDocument();
    expect(screen.getByText(`Themes by ${name}`)).toBeInTheDocument();

    expect(screen.getByText('Next')).toHaveAttribute(
      'href',
      getLocation({ search: `?page=2` }),
    );
  });

  it('renders a UserProfileHead component when user is a developer', async () => {
    const name = 'John Doe';
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: true,
      is_artist: false,
    });

    await waitFor(() => {
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        `The profile of ${name}, Firefox extension author. Find other extensions by ${name}, including average ratings, tenure, and the option to report issues.`,
      );
    });
  });

  it('renders a UserProfileHead component when user is an artist', async () => {
    const name = 'John Doe';
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: false,
      is_artist: true,
    });

    await waitFor(() => {
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        `The profile of ${name}, Firefox theme author. Find other themes by ${name}, including average ratings, tenure, and the option to report issues.`,
      );
    });
  });

  it('renders a UserProfileHead component when user is a developer and an artist', async () => {
    const name = 'John Doe';
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: true,
      is_artist: true,
    });

    await waitFor(() => {
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        `The profile of ${name}, a Firefox extension and theme author. Find other apps by ${name}, including average ratings, tenure, and the option to report issues.`,
      );
    });
  });

  it('sets the description to `null` to UserProfileHead when user is neither a developer nor an artist', async () => {
    const name = 'John Doe';
    signInUserAndRenderUserProfile({
      name,
      is_addon_developer: false,
      is_artist: false,
    });

    await waitFor(() => {
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument();
    });
    expect(getElements('meta[name="description"]')).toHaveLength(0);
  });

  it('sets description to `null` to UserProfileHead when there is no user loaded', async () => {
    renderUserProfile({ userId: 1234 });

    await waitFor(() => {
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument();
    });
    expect(getElements('meta[name="description"]')).toHaveLength(0);
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
    const userId = signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');

    // Create a user with another userId.
    const anotherUserId = userId + 1;
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
        userId: String(userId),
      }),
    );
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on match.params', () => {
      const match = { params: { userId: defaultUserId } };

      expect(extractId({ match })).toEqual(defaultUserId);
    });
  });

  it('dispatches setViewContext when component mounts', () => {
    signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');
    renderUserProfile();

    expect(dispatch).toHaveBeenCalledWith(setViewContext(VIEW_CONTEXT_HOME));
  });

  describe('Tests for AddonsByAuthorsCard', () => {
    // Rending a UserProfile without a loaded user will result in authorIds
    // being null.
    it('renders a LoadingText header when authorIds is null', () => {
      renderUserProfile();

      expect(
        within(
          within(
            screen.getAllByClassName('AddonsByAuthorsCard')[0],
          ).getByClassName('Card-header-text'),
        ).getByRole('alert'),
      ).toBeInTheDocument();
    });

    it('does not dispatch an action if authorIds is null', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderUserProfile();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_ADDONS_BY_AUTHORS }),
      );
    });

    it('does not dispatch an action if authorIds is null on update', async () => {
      const userId = signInUserWithProps();
      const dispatch = jest.spyOn(store, 'dispatch');

      renderUserProfile({ userId });

      dispatch.mockClear();

      const secondUserId = userId + 1;

      await changeLocation({
        history,
        pathname: getLocation({ userId: secondUserId }),
      });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_ADDONS_BY_AUTHORS }),
      );
    });

    describe('with pagination', () => {
      it('shows a paginator when `count` is greater than the number of add-ons to display', async () => {
        signInUserAndRenderUserProfile();
        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 1,
          store,
        });

        await waitFor(() =>
          expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
            'href',
            getLocation({ search: '?page_e=2' }),
          ),
        );
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });

      it('does not show a paginator when `count` is less than the number of add-ons to display', () => {
        signInUserAndRenderUserProfile();
        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE - 1,
          store,
        });

        expect(screen.queryByText('Next')).not.toBeInTheDocument();
      });

      it('passes all the query parameters to the Paginate component', async () => {
        renderUserProfile({
          location: getLocation({ search: '?other=param' }),
          userId: signInUserWithProps(),
        });

        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 1,
          store,
        });

        await waitFor(() =>
          expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
            'href',
            getLocation({ search: '?other=param&page_e=2' }),
          ),
        );
      });

      it('sets the current page based on the `pageParam`', async () => {
        renderUserProfile({
          location: getLocation({ search: '?page_e=2' }),
          userId: signInUserWithProps(),
        });

        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 1,
          store,
        });

        expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
      });

      it('sets the current page to 1 when query parameter has an incorrect value', async () => {
        renderUserProfile({
          location: getLocation({ search: '?page_e=invalid' }),
          userId: signInUserWithProps(),
        });

        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 1,
          store,
        });

        expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
      });

      it('sets the current page to 1 when query parameter has a negative value', async () => {
        renderUserProfile({
          location: getLocation({ search: '?page_e=-11' }),
          userId: signInUserWithProps(),
        });

        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 1,
          store,
        });

        expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
      });

      it('sets the current page to 1 when query parameter is 0', async () => {
        renderUserProfile({
          location: getLocation({ search: '?page_e=0' }),
          userId: signInUserWithProps(),
        });

        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 1,
          store,
        });

        expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
      });

      it('should dispatch a fetch action with `page` and `sort` parameters', () => {
        const dispatch = jest.spyOn(store, 'dispatch');
        signInUserAndRenderUserProfile();

        expect(dispatch).toHaveBeenCalledWith(
          fetchAddonsByAuthors({
            addonType: ADDON_TYPE_EXTENSION,
            authorIds: [defaultUserId],
            errorHandlerId: createErrorHandlerId(),
            page: '1',
            pageSize: String(EXTENSIONS_BY_AUTHORS_PAGE_SIZE),
            sort: SEARCH_SORT_POPULAR,
          }),
        );

        expect(dispatch).toHaveBeenCalledWith(
          fetchAddonsByAuthors({
            addonType: ADDON_TYPE_STATIC_THEME,
            authorIds: [defaultUserId],
            errorHandlerId: createErrorHandlerId(),
            page: '1',
            pageSize: String(THEMES_BY_AUTHORS_PAGE_SIZE),
            sort: SEARCH_SORT_POPULAR,
          }),
        );
      });

      it('should dispatch a fetch action if page changes', async () => {
        const dispatch = jest.spyOn(store, 'dispatch');
        signInUserAndRenderUserProfile();
        loadAddonsByAuthors({
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 1,
          store,
        });

        await userEvent.click(
          await screen.findByRole('link', { name: 'Next' }),
        );

        expect(dispatch).toHaveBeenCalledWith(
          fetchAddonsByAuthors({
            addonType: ADDON_TYPE_EXTENSION,
            authorIds: [defaultUserId],
            errorHandlerId: createErrorHandlerId(),
            page: '2',
            pageSize: String(EXTENSIONS_BY_AUTHORS_PAGE_SIZE),
            sort: SEARCH_SORT_POPULAR,
          }),
        );

        // Verify that the AddonsByAuthors card for Themes did not dispatch.
        expect(dispatch).not.toHaveBeenCalledWith(
          fetchAddonsByAuthors({
            addonType: ADDON_TYPE_STATIC_THEME,
            authorIds: [defaultUserId],
            errorHandlerId: createErrorHandlerId(),
            page: '2',
            pageSize: String(EXTENSIONS_BY_AUTHORS_PAGE_SIZE),
            sort: SEARCH_SORT_POPULAR,
          }),
        );
      });
    });
  });

  describe('Tests for UserProfileHead', () => {
    it.each([
      ['no query parameters', {}, ''],
      ['other query parameters', { foo: '123' }, ''],
      ['only page_e provided', { page_e: '123' }, '?page_e=123'],
      ['only page_t provided', { page_t: '123' }, '?page_t=123'],
      [
        'page_t and another param',
        { page_t: '123', foo: 'bar' },
        '?page_t=123',
      ],
      ['page_e = 1', { page_e: '1' }, ''],
      ['page_t = 1', { page_t: '1' }, ''],
      ['page_e = 1 and page_t = 1', { page_e: '1', page_t: '1' }, ''],
      ['page_t = 1 and page_e = 1', { page_t: '1', page_e: '1' }, ''],
      ['page_e = 1 and page_t = 2', { page_e: '1', page_t: '2' }, '?page_t=2'],
      ['page_t = 1 and page_e = 2', { page_t: '1', page_e: '2' }, '?page_e=2'],
      ['page_e = 2 and page_t = 1', { page_e: '2', page_t: '1' }, '?page_e=2'],
      ['page_t = 2 and page_e = 1', { page_t: '2', page_e: '1' }, '?page_t=2'],
      ['page_e = 2 and page_t = 2', { page_e: '2', page_t: '2' }, '?page_e=2'],
      ['page_t = 2 and page_e = 2', { page_t: '2', page_e: '2' }, '?page_t=2'],
      ['page_e = 3 and page_t = 4', { page_e: '3', page_t: '4' }, '?page_t=4'],
      ['page_e = 4 and page_t = 3', { page_e: '4', page_t: '3' }, '?page_e=4'],
    ])(
      'passes the expected queryString to HeadMetaTags and HeadLinks with %s',
      async (feature, query, expectedQueryString) => {
        const search = `?${Object.keys(query)
          .map((k) => `${k}=${query[k]}`)
          .join('&')}`;
        renderUserProfile({ location: getLocation({ search }) });

        await waitFor(() =>
          expect(getElement('link[rel="canonical"]')).toHaveAttribute(
            'href',
            `${config.get('baseURL')}${getLocation({
              search: expectedQueryString,
            })}`,
          ),
        );

        expect(getElement('meta[property="og:url"]')).toHaveAttribute(
          'content',
          `${config.get('baseURL')}${getLocation({
            search: expectedQueryString,
          })}`,
        );
      },
    );

    it('passes the expected title to HeadMetaTags when not logged in', async () => {
      renderUserProfile();

      await waitFor(() =>
        expect(getElement('meta[property="og:title"]')).toHaveAttribute(
          'content',
          `User Profile – Add-ons for Firefox (${lang})`,
        ),
      );
    });

    it('passes the expected title to HeadMetaTags when logged in', async () => {
      const displayName = 'Bob';
      signInUserAndRenderUserProfile({ display_name: displayName });

      await waitFor(() =>
        expect(getElement('meta[property="og:title"]')).toHaveAttribute(
          'content',
          `User Profile for ${displayName} – Add-ons for Firefox (${lang})`,
        ),
      );
    });
  });

  describe('Tests for ReportUserAbuse', () => {
    const errorHandlerId = 'ReportUserAbuse';

    it('renders a button that links to the user feedback form when enableFeatureFeedbackFormLinks is set', () => {
      const fakeConfig = getMockConfig({
        enableFeatureFeedbackFormLinks: true,
      });
      config.get.mockImplementation((key) => {
        return fakeConfig[key];
      });

      renderForOtherThanSignedInUser();

      expect(
        screen.getByRole('link', { name: 'Report this user for abuse' }),
      ).toBeInTheDocument();
    });

    it('renders a disabled button if no user exists', () => {
      renderUserProfile();

      expect(
        screen.getByRole('button', { name: 'Report this user for abuse' }),
      ).toBeDisabled();
    });

    it('shows the preview content when first rendered', () => {
      renderUserProfile();

      expect(screen.getByClassName('ReportUserAbuse')).not.toHaveClass(
        'ReportUserAbuse--is-expanded',
      );
      expect(
        screen.getByRole('button', { name: 'Report this user for abuse' }),
      ).toBeInTheDocument();
    });

    it('shows more content when the button is clicked', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const userId = renderForOtherThanSignedInUser();

      await userEvent.click(
        screen.getByRole('button', { name: 'Report this user for abuse' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        showUserAbuseReportUI({
          userId,
        }),
      );

      expect(screen.getByClassName('ReportUserAbuse')).toHaveClass(
        'ReportUserAbuse--is-expanded',
      );

      // The initial button should no longer be visible.
      expect(
        screen.queryByRole('button', { name: 'Report this user for abuse' }),
      ).not.toBeInTheDocument();
    });

    it('renders the form in a pre-submitted state', async () => {
      renderForOtherThanSignedInUser();

      await userEvent.click(
        screen.getByRole('button', { name: 'Report this user for abuse' }),
      );

      expect(
        screen.getByRole('heading', { name: 'Report this user for abuse' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Send abuse report' }),
      ).toBeInTheDocument();
    });

    it('hides more content when the cancel button is clicked', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const userId = renderForOtherThanSignedInUser();

      await userEvent.click(
        screen.getByRole('button', { name: 'Report this user for abuse' }),
      );

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(dispatch).toHaveBeenCalledWith(
        hideUserAbuseReportUI({
          userId,
        }),
      );
      expect(screen.getByClassName('ReportUserAbuse')).not.toHaveClass(
        'ReportUserAbuse--is-expanded',
      );
    });

    it('dispatches the send abuse report action', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const message = 'This user is funny';
      const userId = renderForOtherThanSignedInUser();

      await userEvent.click(
        screen.getByRole('button', { name: 'Report this user for abuse' }),
      );

      await userEvent.type(
        screen.getByPlaceholderText(
          'Explain how this user is violating our policies.',
        ),
        message,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Send abuse report' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        sendUserAbuseReport({
          errorHandlerId,
          message,
          userId,
        }),
      );

      expect(
        screen.getByRole('button', { name: 'Sending abuse report' }),
      ).toBeDisabled();
    });

    it('shows a success message and hides the button if report was sent', () => {
      const userId = signInUserWithProps();

      // Create a user with another userId.
      const anotherUserId = userId + 1;
      const user = createUserAccountResponse({ id: anotherUserId });
      store.dispatch(loadUserAccount({ user }));

      const abuseResponse = createFakeUserAbuseReport({
        message: 'Seriously, where is my money?!',
        user,
      });
      store.dispatch(
        loadUserAbuseReport({
          message: abuseResponse.message,
          reporter: abuseResponse.reporter,
          userId: user.id,
        }),
      );

      renderUserProfile({ userId: anotherUserId });

      expect(
        screen.getByRole('heading', {
          name: 'You reported this user',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/^We can't respond to every abuse report/),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Report this user for abuse' }),
      ).not.toBeInTheDocument();
    });

    it('shows a different success message when enableFeatureFeedbackFormLinks is enabled', () => {
      const fakeConfig = getMockConfig({
        enableFeatureFeedbackFormLinks: true,
      });
      config.get.mockImplementation((key) => {
        return fakeConfig[key];
      });

      const userId = signInUserWithProps();

      // Create a user with another userId.
      const anotherUserId = userId + 1;
      const user = createUserAccountResponse({ id: anotherUserId });
      store.dispatch(loadUserAccount({ user }));

      const abuseResponse = createFakeUserAbuseReport({
        message: 'Seriously, where is my money?!',
        user,
      });
      store.dispatch(
        loadUserAbuseReport({
          message: abuseResponse.message,
          reporter: abuseResponse.reporter,
          userId: user.id,
        }),
      );

      renderUserProfile({ userId: anotherUserId });

      expect(
        screen.getByRole('heading', {
          name: 'You reported this user',
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/^We can't respond to every abuse report/),
      ).not.toBeInTheDocument();
    });

    it('renders an error if one exists', () => {
      const message = 'Some error message';
      createFailedErrorHandler({
        id: errorHandlerId,
        message,
        store,
      });

      renderForOtherThanSignedInUser();

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('allows user to submit again if an error occurred', () => {
      createFailedErrorHandler({
        id: errorHandlerId,
        store,
      });

      renderForOtherThanSignedInUser();

      expect(
        screen.getByRole('button', { name: 'Report this user for abuse' }),
      ).not.toBeDisabled();
    });

    describe('Tests for DismissibleTextForm', () => {
      const getLocalStateId = (id) =>
        `src/amo/components/ReportUserAbuse/index.js-${id}`;

      it('recreates LocalState on update when the ID changes', async () => {
        const userId = renderForOtherThanSignedInUser();
        const anotherUserId = userId + 1;

        expect(createLocalState).toHaveBeenCalledWith(getLocalStateId(userId));

        store.dispatch(
          loadUserAccount({
            user: createUserAccountResponse({ id: anotherUserId }),
          }),
        );

        await changeLocation({
          history,
          pathname: getLocation({ userId: anotherUserId }),
        });

        expect(createLocalState).toHaveBeenCalledTimes(2);
        expect(createLocalState).toHaveBeenCalledWith(
          getLocalStateId(anotherUserId),
        );
      });

      it('does not recreate LocalState on update when ID does not change', async () => {
        const userId = renderForOtherThanSignedInUser();

        expect(createLocalState).toHaveBeenCalledWith(getLocalStateId(userId));

        await changeLocation({
          history,
          pathname: getLocation({ userId }),
        });

        expect(createLocalState).toHaveBeenCalledTimes(1);
      });
    });
  });
});
