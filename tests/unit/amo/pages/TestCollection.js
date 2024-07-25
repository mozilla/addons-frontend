import config from 'config';
import { createEvent, fireEvent, waitFor } from '@testing-library/react';
import defaultUserEvent from '@testing-library/user-event';

import { createApiError } from 'amo/api';
import {
  extractId as collectionAddAddonExtractId,
  MESSAGE_RESET_TIME,
} from 'amo/components/CollectionAddAddon';
import { extractId as collectionManagerExtractId } from 'amo/components/CollectionManager';
import { extractId as editableCollectionAddonExtractId } from 'amo/components/EditableCollectionAddon';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  COLLECTION_SORT_NAME,
  FEATURED_THEMES_COLLECTION_EDIT,
  FEATURED_THEMES_COLLECTION_SLUG,
  INSTALL_SOURCE_SUGGESTIONS,
  MOZILLA_COLLECTIONS_EDIT,
} from 'amo/constants';
import { hrefLangs } from 'amo/languages';
import {
  FETCH_CURRENT_COLLECTION,
  FETCH_CURRENT_COLLECTION_PAGE,
  addAddonToCollection,
  addonAddedToCollection,
  addonRemovedFromCollection,
  beginCollectionModification,
  collectionName,
  createCollection,
  deleteCollection,
  deleteCollectionAddonNotes,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  finishEditingCollectionDetails,
  loadCurrentCollection,
  removeAddonFromCollection,
  updateCollection,
  updateCollectionAddon,
} from 'amo/reducers/collections';
import { loadCollectionAbuseReport } from 'amo/reducers/collectionAbuseReports';
import {
  SEND_SERVER_REDIRECT,
  sendServerRedirect,
} from 'amo/reducers/redirectTo';
import {
  DEFAULT_ADDON_PLACEHOLDER_COUNT,
  extractId,
} from 'amo/pages/Collection';
import {
  changeLocation,
  createFakeAutocompleteResult,
  createFakeCollectionAddon,
  createFailedErrorHandler,
  createFakeCollectionDetail,
  createInternalCollectionWithLang,
  createLocalizedString,
  createFakeCollectionAddonsListResponse,
  dispatchAutocompleteResults,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAddon,
  fakeI18n,
  fakePreview,
  getElement,
  getElements,
  getMockConfig,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

jest.mock('amo/localState', () =>
  jest.fn(() => {
    return {
      clear: jest.fn(() => Promise.resolve()),
      load: jest.fn(() => Promise.resolve(null)),
      save: jest.fn(() => Promise.resolve()),
    };
  }),
);

jest.mock('config');

describe(__filename, () => {
  let history;
  let store;
  let userEvent;
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultCollectionDescription = 'Collection description';
  const defaultCollectionId = 987;
  const defaultCollectionName = 'Collection name';
  const defaultCollectionSort = COLLECTION_SORT_DATE_ADDED_DESCENDING;
  const defaultPage = '1';
  const defaultFilters = {
    collectionSort: defaultCollectionSort,
    page: defaultPage,
  };
  const defaultSlug = 'default-collection-slug';
  const defaultUserId = 123;
  const editableCollectionAddonErrorHandlerId =
    'src/amo/components/EditableCollectionAddon/index.js-editable-collection-addon-1234';
  const lang = 'en-US';
  const mozillaUserId = 4757633;

  const getLocation = ({
    editing = false,
    slug = defaultSlug,
    userId = defaultUserId,
  } = {}) =>
    `/${lang}/${clientApp}/collections/${userId}/${slug}/${
      editing ? 'edit/' : ''
    }`;
  const defaultLocation = getLocation();

  const getCollectionPageErrorHandlerId = ({
    page = '',
    slug = defaultSlug,
    userId = defaultUserId,
  } = {}) => `src/amo/pages/Collection/index.js-${userId}/${slug}/${page}`;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
    userEvent = defaultUserEvent.setup({ delay: null });
    const fakeConfig = getMockConfig({
      // This is needed by some of the tests below.
      mozillaUserId,
    });
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks().resetModules();
  });

  const _createFakeCollectionDetail = (props = {}) => {
    return createFakeCollectionDetail({
      authorId: defaultUserId,
      description: defaultCollectionDescription,
      id: defaultCollectionId,
      name: defaultCollectionName,
      slug: defaultSlug,
      ...props,
    });
  };

  const render = ({
    editing = false,
    location,
    slug = defaultSlug,
    userId = defaultUserId,
  } = {}) => {
    const initialEntry = location || getLocation({ editing, slug, userId });

    const renderOptions = {
      initialEntries: [initialEntry],
      store,
    };

    const renderResult = defaultRender(renderOptions);
    history = renderResult.history;
    return renderResult;
  };

  const _loadCurrentCollection = ({
    addonsResponse = createFakeCollectionAddonsListResponse(),
    detail = _createFakeCollectionDetail(),
  } = {}) => {
    store.dispatch(
      loadCurrentCollection({
        addonsResponse,
        detail,
      }),
    );
  };

  const renderWithCollection = ({
    addons = [createFakeCollectionAddon({ addon: fakeAddon })],
    addonsResponse = createFakeCollectionAddonsListResponse({ addons }),
    detailProps = {},
    editing,
    location,
    slug,
    userId,
  } = {}) => {
    _loadCurrentCollection({
      addonsResponse,
      detail: {
        ..._createFakeCollectionDetail(detailProps),
        count: addons.length,
      },
    });

    return render({ editing, location, slug, userId });
  };

  const renderWithCollectionForSignedInUser = ({
    addons,
    addonsResponse,
    detailProps = {},
    editing,
    location,
    slug,
    userId = defaultUserId,
  } = {}) => {
    dispatchSignInActionsWithStore({ store, userId });
    return renderWithCollection({
      addons,
      addonsResponse,
      detailProps: { ...detailProps, authorId: userId },
      editing,
      location,
      slug,
      userId,
    });
  };

  const renderInAddMode = ({ loggedIn = true, withAddonId } = {}) => {
    if (loggedIn) {
      dispatchSignInActionsWithStore({ store, userId: defaultUserId });
    }
    return render({
      location: `/${lang}/${clientApp}/collections/add/${
        withAddonId ? `?include_addon_id=${withAddonId}` : ''
      }`,
    });
  };

  const renderWithNotes = (notes = 'Some notes') => {
    renderWithCollectionForSignedInUser({
      addons: [
        createFakeCollectionAddon({
          notes,
        }),
      ],
      editing: true,
    });
  };

  const clickEditButton = async () =>
    userEvent.click(screen.getByRole('link', { name: 'Edit this collection' }));

  const assertNoLoadingActionsDispatched = (dispatch) => {
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_CURRENT_COLLECTION }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_CURRENT_COLLECTION_PAGE }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: SEND_SERVER_REDIRECT }),
    );
    return true;
  };

  const _addonAddedToCollection = async () => {
    store.dispatch(
      addonAddedToCollection({
        addonId: 123,
        collectionId: defaultCollectionId,
        userId: defaultUserId,
      }),
    );
    expect(await screen.findByText('Added to collection')).toBeInTheDocument();
  };

  const _addonRemovedFromCollection = () => {
    store.dispatch(addonRemovedFromCollection());
  };

  // Note: This test will be replaced by a test for CollectionDetailsCard
  // eslint-disable-next-line jest/no-commented-out-tests
  /*
  it('renders a CollectionDetailsCard', () => {
    const creating = false;
    const editing = false;
    const addonsResponse = createFakeCollectionAddonsListResponse();
    const detail = createFakeCollectionDetail();
    const collection = createInternalCollectionWithLang({
      detail,
      addonsResponse,
    });
    const page = 1;
    const sort = COLLECTION_SORT_NAME;
    const queryParams = { page, collection_sort: sort };
    const { store } = dispatchClientMetadata();

    _loadCurrentCollection({ addonsResponse, detail, store });

    const wrapper = renderComponent({
      creating,
      editing,
      location: createFakeLocation({ query: queryParams }),
      store,
    });

    const detailsCard = wrapper.find(CollectionDetailsCard);
    expect(detailsCard).toHaveProp('collection', collection);
    expect(detailsCard).toHaveProp('creating', creating);
    expect(detailsCard).toHaveProp('editing', editing);
    expect(detailsCard).toHaveProp('filters', { page, collectionSort: sort });
  });
  */

  it('renders placeholder text if there are no add-ons', () => {
    renderWithCollectionForSignedInUser({ addons: [] });

    expect(
      screen.getByText(
        'Search for extensions and themes to add to your collection.',
      ),
    ).toBeInTheDocument();
  });

  it('renders placeholder text when creating a collection', () => {
    renderInAddMode();

    expect(
      screen.getByText(
        'First, create your collection. Then you can add extensions and themes.',
      ),
    ).toBeInTheDocument();
  });

  it('hides placeholder text when creating a collection if not logged in', () => {
    renderInAddMode({ loggedIn: false });

    expect(
      screen.queryByText(
        'First, create your collection. Then you can add extensions and themes.',
      ),
    ).not.toBeInTheDocument();
  });

  it('hides placeholder text if there are add-ons', () => {
    renderWithCollectionForSignedInUser({
      addons: [createFakeCollectionAddon({ addon: fakeAddon })],
    });

    expect(
      screen.queryByText(
        'Search for extensions and themes to add to your collection.',
      ),
    ).not.toBeInTheDocument();
  });

  it('hides placeholder text when viewing a collection if the user is not logged in', () => {
    renderWithCollection({ addons: [] });

    expect(
      screen.queryByText(
        'Search for extensions and themes to add to your collection.',
      ),
    ).not.toBeInTheDocument();
  });

  it('dispatches fetchCurrentCollection on mount', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId(),
        filters: defaultFilters,
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  // // See: https://github.com/mozilla/addons-frontend/issues/7424
  it('dispatches fetchCurrentCollection on mount with a username in the URL', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = 'this-is-not-a-user-id';
    render({ userId });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId({ userId }),
        filters: defaultFilters,
        slug: defaultSlug,
        userId,
      }),
    );
  });

  it('does not dispatch any loading actions when switching to edit mode', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollectionForSignedInUser();

    await clickEditButton();

    expect(
      screen.getByRole('link', { name: 'Back to collection' }),
    ).toBeInTheDocument();
    expect(assertNoLoadingActionsDispatched(dispatch)).toBeTruthy();
  });

  it('does not dispatch any loading actions when creating a collection', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderInAddMode();

    expect(assertNoLoadingActionsDispatched(dispatch)).toBeTruthy();
  });

  it('passes filters from the query string to fetchCurrentCollection', () => {
    const page = '123';
    const sort = COLLECTION_SORT_NAME;
    const dispatch = jest.spyOn(store, 'dispatch');
    render({
      location: `${defaultLocation}?page=${page}&collection_sort=${sort}`,
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId({ page }),
        filters: { page, collectionSort: sort },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('does not dispatch any loading actions when location has not changed', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollection();

    await changeLocation({
      history,
      pathname: '/another/path/',
    });

    expect(assertNoLoadingActionsDispatched(dispatch)).toBeTruthy();
  });

  it('does not dispatch any loading actions when a collection is loaded', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollection();

    expect(assertNoLoadingActionsDispatched(dispatch)).toBeTruthy();
  });

  it('does not dispatch any loading actions when a collection is loading', () => {
    store.dispatch(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId(),
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(assertNoLoadingActionsDispatched(dispatch)).toBeTruthy();
  });

  it('does not dispatch any loading actions when a collection page is loading', () => {
    store.dispatch(
      fetchCurrentCollectionPage({
        errorHandlerId: getCollectionPageErrorHandlerId(),
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(assertNoLoadingActionsDispatched(dispatch)).toBeTruthy();
  });

  it('does not dispatch any loading actions when there is an error', () => {
    createFailedErrorHandler({
      id: getCollectionPageErrorHandlerId(),
      store,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(assertNoLoadingActionsDispatched(dispatch)).toBeTruthy();
  });

  it('dispatches fetchCurrentCollection when location pathname has changed', async () => {
    const slug = `${defaultSlug}-new`;
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollection();

    await changeLocation({
      history,
      pathname: getLocation({ slug }),
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId({ slug }),
        filters: defaultFilters,
        slug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches fetchCurrentCollectionPage when page has changed', async () => {
    const page = '2';
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollection({ location: `${defaultLocation}?page=1` });

    await changeLocation({
      history,
      pathname: `${defaultLocation}?page=${page}`,
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollectionPage({
        errorHandlerId: getCollectionPageErrorHandlerId({ page }),
        filters: { ...defaultFilters, page },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches fetchCurrentCollectionPage when sort has changed', async () => {
    const sort = COLLECTION_SORT_NAME;
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollection();

    await changeLocation({
      history,
      pathname: `${defaultLocation}?collection_sort=${sort}`,
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollectionPage({
        errorHandlerId: getCollectionPageErrorHandlerId(),
        filters: { ...defaultFilters, collectionSort: sort },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches fetchCurrentCollection when user param has changed', async () => {
    const userId = defaultUserId + 1;
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollection();

    await changeLocation({
      history,
      pathname: getLocation({ userId }),
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId({ userId }),
        filters: defaultFilters,
        slug: defaultSlug,
        userId,
      }),
    );
  });

  it('dispatches fetchCurrentCollection when slug param has changed', async () => {
    const slug = `${defaultSlug}-new`;
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollection();

    await changeLocation({
      history,
      pathname: getLocation({ slug }),
    });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId({ slug }),
        filters: defaultFilters,
        slug,
        userId: defaultUserId,
      }),
    );
  });

  it('renders collection add-ons', () => {
    const addonName = 'My add-on';
    renderWithCollection({
      addons: [
        createFakeCollectionAddon({
          addon: {
            ...fakeAddon,
            name: createLocalizedString(addonName),
            type: ADDON_TYPE_STATIC_THEME,
          },
        }),
      ],
    });

    const expectedQuerystring = [
      'utm_source=addons.mozilla.org',
      'utm_medium=referral',
      'utm_content=collection',
    ].join('&');

    expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/addon/${fakeAddon.slug}/?${expectedQuerystring}`,
    );
    expect(screen.getByAltText(addonName)).toHaveAttribute(
      'src',
      fakePreview.image_url,
    );
  });

  it('uses an addonInstallSource when passed on the URL', () => {
    const addonName = 'My add-on';
    renderWithCollection({
      addons: [
        createFakeCollectionAddon({
          addon: {
            ...fakeAddon,
            name: createLocalizedString(addonName),
          },
        }),
      ],
      location: `${getLocation()}?addonInstallSource=${INSTALL_SOURCE_SUGGESTIONS}`,
    });

    const expectedQuerystring = [
      'utm_source=addons.mozilla.org',
      'utm_medium=referral',
      `utm_content=${INSTALL_SOURCE_SUGGESTIONS}`,
    ].join('&');

    expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/addon/${fakeAddon.slug}/?${expectedQuerystring}`,
    );
  });

  it('sets placeholder counts for the AddonsCard as expected', async () => {
    render();

    // Each SearchResult will have 4 instances of LoadingText.
    expect(
      within(screen.getByClassName('AddonsCard')).getAllByRole('alert'),
    ).toHaveLength(DEFAULT_ADDON_PLACEHOLDER_COUNT * 4);

    _loadCurrentCollection({
      addonsResponse: createFakeCollectionAddonsListResponse({
        addons: [
          createFakeCollectionAddon({
            addon: fakeAddon,
          }),
        ],
      }),
    });

    // After loading no loading indicators will be present.
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );

    // Switch to a different slug, which will initiate a new loading state.
    await changeLocation({
      history,
      pathname: getLocation({ slug: `${defaultSlug}-new` }),
    });

    // Only expect one loading SearchResult as that matches the number of
    // add-ons in the previously loaded collection.
    expect(
      within(screen.getByClassName('AddonsCard')).getAllByRole('alert'),
    ).toHaveLength(4);
  });

  it('renders a collection with pagination', () => {
    const sort = COLLECTION_SORT_NAME;
    // With a pageSize < count, the pagination will be displayed.
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: 5,
    });
    _loadCurrentCollection({ addonsResponse });

    render({
      location: `${getLocation()}?collection_sort=${sort}&page=2`,
    });

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      `${defaultLocation}?page=1&collection_sort=${sort}`,
    );
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders a create collection page', () => {
    renderInAddMode();

    const expectedUrlPrefix = `${config.get(
      'apiHost',
    )}/${lang}/${clientApp}/collections/${defaultUserId}/`;
    expect(
      screen.getByRole('textbox', { name: 'Collection name' }),
    ).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
      '',
    );
    expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue('');
    expect(screen.getByTitle(expectedUrlPrefix)).toHaveTextContent(
      expectedUrlPrefix,
    );
    expect(
      screen.getByRole('button', { name: 'Create collection' }),
    ).toHaveProperty('disabled', true);

    // Sort controls should be absent.
    expect(
      screen.queryByRole('combobox', { name: 'Sort add-ons by' }),
    ).not.toBeInTheDocument();

    // Collection add-ons should be absent.
    expect(screen.queryByClassName('AddonsCard')).not.toBeInTheDocument();
  });

  it('does not render the pagination when no add-ons in the collection', () => {
    renderWithCollection({ addons: [] });

    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('renders loading indicator on add-ons when fetching next page', async () => {
    const name = 'My Collection';
    const numberOfAddons = 5;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: numberOfAddons,
    });
    _loadCurrentCollection({
      addonsResponse,
      detail: _createFakeCollectionDetail({ name }),
    });

    render({
      location: `${getLocation()}?page=1`,
    });

    await userEvent.click(screen.getByRole('link', { name: 'Next' }));

    // Expect loading indicators for the add-ons.
    expect(
      within(screen.getByClassName('AddonsCard')).getAllByRole('alert'),
    ).toHaveLength(numberOfAddons * 4);
    // Expect to retain the details of the collection.
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  });

  it('renders 404 page for missing collection', () => {
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
      }),
      id: getCollectionPageErrorHandlerId(),
      store,
    });

    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders an error if one exists', () => {
    const message = 'Some error message';
    createFailedErrorHandler({
      id: getCollectionPageErrorHandlerId(),
      message,
      store,
    });

    render();

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders an HTML title', async () => {
    renderWithCollection();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `${defaultCollectionName} – Add-ons for Firefox (en-US)`,
      ),
    );
  });

  it('renders an HTML title for a collection with a missing name', async () => {
    renderWithCollection({ detailProps: { name: null } });

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `${collectionName({
          name: null,
          i18n: fakeI18n(),
        })} – Add-ons for Firefox (en-US)`,
      ),
    );
  });

  it('renders the default HTML title when there is no collection loaded', async () => {
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        'Add-ons for Firefox (en-US)',
      ),
    );
  });

  it('renders a delete button when user is the collection owner', () => {
    renderWithCollectionForSignedInUser();

    expect(
      screen.getByRole('button', { name: 'Delete this collection' }),
    ).toBeInTheDocument();
  });

  it('does not render a delete button when user is not the collection owner', () => {
    dispatchSignInActionsWithStore({ store, userId: defaultUserId + 1 });
    renderWithCollection();

    expect(
      screen.queryByRole('button', { name: 'Delete this collection' }),
    ).not.toBeInTheDocument();
  });

  it('renders a CollectionAddAddon component when editing', () => {
    renderWithCollectionForSignedInUser({ editing: true });

    expect(
      screen.getByPlaceholderText(
        'Find an add-on to include in this collection',
      ),
    ).toBeInTheDocument();
  });

  it('does not render a CollectionAddAddon component when not editing', () => {
    renderWithCollectionForSignedInUser();

    expect(
      screen.queryByPlaceholderText(
        'Find an add-on to include in this collection',
      ),
    ).not.toBeInTheDocument();
  });

  it('renders AuthenticateButton when creating and not signed in', () => {
    renderInAddMode({ loggedIn: false });

    expect(
      screen.getByRole('link', { name: 'Log in to create a collection' }),
    ).toBeInTheDocument();

    // Make sure the form was not rendered.
    expect(
      screen.queryByRole('textbox', { name: 'Collection name' }),
    ).not.toBeInTheDocument();
  });

  it('renders AuthenticateButton when editing and not signed in', () => {
    renderWithCollection({ editing: true });

    expect(
      screen.getByRole('link', { name: 'Log in to edit this collection' }),
    ).toBeInTheDocument();

    // Make sure the form was not rendered.
    expect(
      screen.queryByRole('textbox', { name: 'Collection name' }),
    ).not.toBeInTheDocument();
  });

  it('does not update the page when removeAddon is called and there are still addons to show on the current page', async () => {
    const numberOfAddons = 5;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: numberOfAddons,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const page = '2';
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollectionForSignedInUser({
      addonsResponse,
      location: `${getLocation({ editing: true })}?page=${page}`,
    });

    const pushSpy = jest.spyOn(history, 'push');

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(dispatch).toHaveBeenCalledWith(
      removeAddonFromCollection({
        addonId,
        errorHandlerId: getCollectionPageErrorHandlerId({ page }),
        filters: { ...defaultFilters, page },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("does not update the page when removeAddon is called and the current page isn't the last page", async () => {
    const numberOfAddons = 5;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: numberOfAddons,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const page = '1';
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollectionForSignedInUser({
      addonsResponse,
      location: `${getLocation({ editing: true })}?page=${page}`,
    });

    const pushSpy = jest.spyOn(history, 'push');

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(dispatch).toHaveBeenCalledWith(
      removeAddonFromCollection({
        addonId,
        errorHandlerId: getCollectionPageErrorHandlerId({ page }),
        filters: { ...defaultFilters, page },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('updates the page when removeAddon removes the last addon from the current page', async () => {
    const numberOfAddons = 1;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 2,
      pageSize: numberOfAddons,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const page = '2';
    const sort = COLLECTION_SORT_DATE_ADDED_DESCENDING;
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollectionForSignedInUser({
      addonsResponse,
      location: `${getLocation({
        editing: true,
      })}?page=${page}&collection_sort=${sort}`,
    });

    const pushSpy = jest.spyOn(history, 'push');

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(dispatch).toHaveBeenCalledWith(
      removeAddonFromCollection({
        addonId,
        errorHandlerId: getCollectionPageErrorHandlerId({ page }),
        filters: { ...defaultFilters, page: '1' },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
    expect(pushSpy).toHaveBeenCalledWith({
      pathname: getLocation({ editing: true }),
      query: {
        collection_sort: sort,
        page: '1',
      },
    });
  });

  it('dispatches deleteCollection when the Delete collection button is clicked and confirmed', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollectionForSignedInUser();

    const button = screen.getByRole('button', {
      name: 'Delete this collection',
    });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    fireEvent(button, clickEvent);

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(preventDefaultWatcher).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      deleteCollection({
        errorHandlerId: getCollectionPageErrorHandlerId(),
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches deleteCollectionAddonNotes when clicking delete on DismissibleTextForm', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithNotes();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(dispatch).toHaveBeenCalledWith(
      deleteCollectionAddonNotes({
        addonId: fakeAddon.id,
        errorHandlerId: editableCollectionAddonErrorHandlerId,
        filters: defaultFilters,
        lang,
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches updateCollectionAddon when saving DismissibleTextForm', async () => {
    const newNotes = 'Some new notes';
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithNotes();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const input = screen.getByPlaceholderText(
      'Add a comment about this add-on.',
    );
    await userEvent.clear(input);
    await userEvent.type(input, newNotes);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(dispatch).toHaveBeenCalledWith(
      updateCollectionAddon({
        addonId: fakeAddon.id,
        errorHandlerId: editableCollectionAddonErrorHandlerId,
        filters: defaultFilters,
        notes: createLocalizedString(newNotes, lang),
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('sends a server redirect when userId parameter is not a numeric ID', async () => {
    const authorId = 19;
    const authorUsername = 'john';

    _loadCurrentCollection({
      detail: _createFakeCollectionDetail({
        authorId,
        authorUsername,
      }),
    });

    const dispatch = jest
      .spyOn(store, 'dispatch')
      .mockImplementation(() => null);

    render({ userId: authorUsername });

    expect(dispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/collections/${authorId}/${defaultSlug}/`,
      }),
    );
  });

  it('sends a server redirect when slug parameter case is not the same as the collection slug', () => {
    _loadCurrentCollection();

    const dispatch = jest
      .spyOn(store, 'dispatch')
      .mockImplementation(() => null);

    render({ slug: defaultSlug.toUpperCase() });

    expect(dispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/collections/${defaultUserId}/${defaultSlug}/`,
      }),
    );
  });

  it('renders a "description" meta tag', async () => {
    const name = 'my super collection';
    const description = 'this is the description of my super collection';
    renderWithCollection({ detailProps: { name, description } });

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        [
          'Download and create Firefox collections to keep track of favorite extensions and themes.',
          `Explore the ${name}—${description}.`,
        ].join(' '),
      ),
    );
  });

  it('renders a "description" meta tag without a collection description', async () => {
    const name = 'my super collection';
    const description = '';
    renderWithCollection({ detailProps: { name, description } });

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        [
          'Download and create Firefox collections to keep track of favorite extensions and themes.',
          `Explore the ${name}.`,
        ].join(' '),
      ),
    );
  });

  it('renders a "description" meta tag for a collection with a missing name', async () => {
    const name = null;
    const description = '';

    renderWithCollection({ detailProps: { name, description } });

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        [
          'Download and create Firefox collections to keep track of favorite extensions and themes.',
          `Explore the ${collectionName({
            name,
            i18n: fakeI18n(),
          })}.`,
        ].join(' '),
      ),
    );
  });

  it('renders canonical and alternate links for mozilla collections', async () => {
    renderWithCollection({
      detailProps: { authorId: mozillaUserId },
      userId: mozillaUserId,
    });

    const getExpectedURL = (locale, app) => {
      return `${config.get(
        'baseURL',
      )}/${locale}/${app}/collections/${mozillaUserId}/${defaultSlug}/`;
    };

    await waitFor(() =>
      expect(getElement('link[rel="canonical"]')).toHaveAttribute(
        'href',
        getExpectedURL('en-US', 'firefox'),
      ),
    );

    await waitFor(() =>
      expect(getElement('link[rel="alternate"]')).toBeInTheDocument(),
    );

    expect(getElements('link[rel="alternate"]')).toHaveLength(hrefLangs.length);

    const hrefLangsMap = config.get('hrefLangsMap');
    hrefLangs.forEach((hrefLang) => {
      const locale = hrefLangsMap[hrefLang] || hrefLang;
      expect(
        getElement(`link[rel="alternate"][hreflang="${hrefLang}"]`),
      ).toHaveAttribute('href', getExpectedURL(locale, 'firefox'));
    });
  });

  it('does not render canonical and alternate links for non-mozilla collections', async () => {
    renderWithCollection();

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toBeInTheDocument(),
    );
    expect(getElements('link[rel="canonical"]')).toHaveLength(0);
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const props = {
        match: {
          params: {
            userId: '123',
            slug: 'collection-bar',
          },
        },
        location: { query: {} },
      };

      expect(extractId(props)).toEqual('123/collection-bar/');
    });

    it('adds the page as part of unique ID', () => {
      const props = {
        match: {
          params: {
            userId: '123',
            slug: 'collection-bar',
          },
        },
        location: { query: { page: '124' } },
      };

      expect(extractId(props)).toEqual('123/collection-bar/124');
    });
  });

  describe('Tests for CollectionAddAddon', () => {
    const getErrorHandlerId = (id = '') =>
      `src/amo/components/CollectionAddAddon/index.js-collection${id}`;

    const selectAnAddon = async ({ addonName, id }) => {
      await userEvent.type(
        screen.getByPlaceholderText(
          'Find an add-on to include in this collection',
        ),
        'test',
      );
      const externalSuggestion = createFakeAutocompleteResult({
        name: addonName,
        id,
      });
      await dispatchAutocompleteResults({
        results: [externalSuggestion],
        store,
      });
      await userEvent.click(screen.getByText(addonName));
    };

    it('renders an error', async () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultCollectionId),
        message,
        store,
      });

      expect(await screen.findByText(message)).toBeInTheDocument();
    });

    it('dispatches addAddonToCollection when selecting an add-on', async () => {
      const addonName = 'uBlock Origin';
      const id = 123;
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithCollectionForSignedInUser({ editing: true });

      await selectAnAddon({ addonName, id });

      expect(dispatch).toHaveBeenCalledWith(
        addAddonToCollection({
          addonId: id,
          collectionId: defaultCollectionId,
          slug: defaultSlug,
          editing: true,
          errorHandlerId: getErrorHandlerId(defaultCollectionId),
          filters: defaultFilters,
          userId: defaultUserId,
        }),
      );
    });

    it('displays a notification for 5 seconds after an add-on has been added', async () => {
      jest.useFakeTimers({ legacyFakeTimers: true });
      renderWithCollectionForSignedInUser({ editing: true });

      expect(screen.queryByText('Added to collection')).not.toBeInTheDocument();

      await _addonAddedToCollection();

      expect(screen.getByText('Added to collection')).toBeInTheDocument();
      expect(screen.getByClassName('Notice-success')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter',
      );

      // Trigger the setTimeout behavior.
      jest.advanceTimersByTime(MESSAGE_RESET_TIME);

      // The Notice element will still be present, but the fade transition,
      // controlled by CSSTransition should have been started.
      await waitFor(() =>
        expect(screen.getByClassName('Notice-success')).toHaveClass(
          'CollectionAddAddon-noticePlaceholder-transition-enter-done',
        ),
      );
    });

    it('displays a notification for 5 seconds after an add-on has been removed', async () => {
      jest.useFakeTimers({ legacyFakeTimers: true });
      renderWithCollectionForSignedInUser({ editing: true });

      expect(
        screen.queryByText('Removed from collection'),
      ).not.toBeInTheDocument();

      _addonRemovedFromCollection();

      expect(
        await screen.findByText('Removed from collection'),
      ).toBeInTheDocument();
      expect(screen.getByClassName('Notice-generic')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter',
      );

      // Trigger the setTimeout behavior.
      jest.advanceTimersByTime(MESSAGE_RESET_TIME);

      // The Notice element will still be present, but the fade transition,
      // controlled by CSSTransition should have been started.
      await waitFor(() =>
        expect(screen.getByClassName('Notice-generic')).toHaveClass(
          'CollectionAddAddon-noticePlaceholder-transition-enter-done',
        ),
      );
    });

    it('clears the errorHandler when an add-on is added', async () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultCollectionId),
        message,
        store,
      });

      expect(await screen.findByText(message)).toBeInTheDocument();

      await _addonAddedToCollection();

      expect(screen.queryByText(message)).not.toBeInTheDocument();
    });

    it('clears the errorHandler when an add-on is removed', async () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultCollectionId),
        message,
        store,
      });

      expect(await screen.findByText(message)).toBeInTheDocument();

      _addonRemovedFromCollection();

      await waitFor(() =>
        expect(screen.queryByText(message)).not.toBeInTheDocument(),
      );
    });

    it('removes the notification after a new add-on has been selected', async () => {
      const addonName = 'uBlock Origin';
      const id = 123;
      renderWithCollectionForSignedInUser({ editing: true });

      expect(screen.queryByText('Added to collection')).not.toBeInTheDocument();

      await _addonAddedToCollection();

      expect(screen.getByText('Added to collection')).toBeInTheDocument();
      expect(screen.getByClassName('Notice-success')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter',
      );

      await selectAnAddon({ addonName, id });

      // The Notice element will still be present, but the fade transition,
      // controlled by CSSTransition should be exiting.
      expect(screen.getByClassName('Notice-success')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-exit',
      );
    });

    describe('extractId', () => {
      it('generates an ID without a collection', () => {
        expect(collectionAddAddonExtractId({ collection: null })).toEqual(
          'collection',
        );
      });

      it('generates an ID with a collection', () => {
        const id = 12345;
        const collection = createInternalCollectionWithLang({
          detail: createFakeCollectionDetail({
            id,
          }),
        });
        expect(collectionAddAddonExtractId({ collection })).toEqual(
          `collection${id}`,
        );
      });
    });
  });

  describe('Tests for CollectionSort', () => {
    it.each([true, false])(
      `calls history.push with expected pathname and query when a sort is selected and editing is %s`,
      async (editing) => {
        const location = getLocation({ editing });
        const sort = COLLECTION_SORT_NAME;

        renderWithCollectionForSignedInUser({ location });
        const pushSpy = jest.spyOn(history, 'push');

        await userEvent.selectOptions(
          screen.getByRole('combobox', { name: 'Sort add-ons by' }),
          'Name',
        );

        expect(pushSpy).toHaveBeenCalledWith({
          pathname: location,
          query: { collection_sort: sort, page: '1' },
        });
      },
    );
  });

  describe('Tests for EditableCollectionAddon', () => {
    it('renders a class name with its type', () => {
      const type = ADDON_TYPE_STATIC_THEME;
      renderWithCollectionForSignedInUser({
        addons: [
          createFakeCollectionAddon({
            addon: {
              ...fakeAddon,
              type,
            },
          }),
        ],
        editing: true,
      });

      expect(screen.getByClassName('EditableCollectionAddon')).toHaveClass(
        `EditableCollectionAddon--${type}`,
      );
    });

    it("renders the add-on's icon", () => {
      const addonName = 'My add-on';
      renderWithCollectionForSignedInUser({
        addons: [
          createFakeCollectionAddon({
            addon: {
              ...fakeAddon,
              name: createLocalizedString(addonName),
            },
          }),
        ],
        editing: true,
      });

      expect(screen.getByAltText(addonName)).toHaveAttribute(
        'src',
        fakeAddon.icon_url,
      );
    });

    it('displays the leave a note button when no notes exist', () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const button = screen.getByRole('button', { name: 'Leave a note' });
      expect(button).toHaveClass('Button--action');
      expect(button).toHaveClass('Button--micro');
    });

    it('hides the leave a note button when notes exist', () => {
      renderWithNotes();

      expect(
        screen.getByClassName('EditableCollectionAddon-leaveNote--hidden'),
      ).toBeInTheDocument();
    });

    it('renders the remove button', () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const button = screen.getByRole('button', { name: 'Remove' });
      expect(button).toHaveClass('Button--alert');
      expect(button).toHaveClass('Button--micro');
    });

    it('dispatches removeAddonFromCollection when the remove button is clicked', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithCollectionForSignedInUser({ editing: true });

      const button = screen.getByRole('button', { name: 'Remove' });
      const clickEvent = createEvent.click(button);
      const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
      const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');
      fireEvent(button, clickEvent);

      expect(preventDefaultWatcher).toHaveBeenCalled();
      expect(stopPropagationWatcher).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(
        removeAddonFromCollection({
          addonId: fakeAddon.id,
          errorHandlerId: getCollectionPageErrorHandlerId(),
          filters: defaultFilters,
          slug: defaultSlug,
          userId: defaultUserId,
        }),
      );
    });

    describe('notes area', () => {
      it('hides the notes area by default', () => {
        renderWithCollectionForSignedInUser({ editing: true });

        expect(
          screen.queryByRole('heading', { name: `Collector's note` }),
        ).not.toBeInTheDocument();
      });

      it('shows the read-only version of the notes area if there are notes', () => {
        const notes = 'Some notes.';
        renderWithNotes(notes);

        expect(
          screen.getByRole('heading', { name: `Collector's note` }),
        ).toBeInTheDocument();
        expect(screen.getByText(notes)).toBeInTheDocument();
        expect(screen.getByClassName('Icon-comments-blue')).toBeInTheDocument();

        const button = screen.getByRole('button', { name: 'Edit' });
        expect(button).toHaveClass('Button--action');
        expect(button).toHaveClass('Button--micro');

        // The form should not be shown.
        expect(
          screen.queryByPlaceholderText('Add a comment about this add-on.'),
        ).not.toBeInTheDocument();
      });
    });

    it('renders newlines in notes', () => {
      const notes = 'Some\nnotes.';
      renderWithNotes(notes);

      const notesContent = screen.getByClassName(
        'EditableCollectionAddon-notes-content',
      );
      expect(notesContent).toHaveTextContent('Somenotes.');
      expect(within(notesContent).getByTagName('br')).toBeInTheDocument();
    });

    it('shows an empty notes form when the leave a note button is clicked', async () => {
      renderWithCollectionForSignedInUser({ editing: true });

      await userEvent.click(
        screen.getByRole('button', { name: 'Leave a note' }),
      );

      expect(
        screen.getByRole('heading', { name: 'Leave a note' }),
      ).toBeInTheDocument();
      expect(screen.getByClassName('Icon-comments-blue')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Add a comment about this add-on.'),
      ).toHaveValue('');

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toHaveClass('Button--neutral');
      expect(cancelButton).toHaveClass('Button--micro');
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toHaveClass('Button--action');
      expect(saveButton).toHaveClass('Button--micro');

      // The read-only portion should not be shown.
      expect(
        screen.queryByRole('heading', { name: `Collector's note` }),
      ).not.toBeInTheDocument();
    });

    it('renders clickable URL in notes', () => {
      const linkText = 'click here';
      const linkHref = 'https://addons.mozilla.org';
      const notes = `<a href="${linkHref}">${linkText}</a>`;
      renderWithNotes(notes);

      expect(screen.getByRole('link', { name: linkText })).toHaveAttribute(
        'href',
        linkHref,
      );
    });

    it('does not show <a> tag in DismissibleTextForm when editing notes', async () => {
      const linkText = 'click here';
      const linkHref = 'https://addons.mozilla.org';
      const notes = `<a href="${linkHref}">${linkText}</a>`;
      renderWithNotes(notes);

      await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

      expect(
        screen.getByPlaceholderText('Add a comment about this add-on.'),
      ).toHaveValue(linkText);

      // The read-only portion should not be shown.
      expect(
        screen.queryByRole('heading', { name: `Collector's note` }),
      ).not.toBeInTheDocument();
    });

    it('hides the notes form when the cancel button is clicked', async () => {
      renderWithNotes();

      await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

      expect(
        screen.getByPlaceholderText('Add a comment about this add-on.'),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(
        screen.queryByPlaceholderText('Add a comment about this add-on.'),
      ).not.toBeInTheDocument();
    });

    describe('errorHandler - extractId', () => {
      it('returns a unique ID with an add-on', () => {
        expect(editableCollectionAddonExtractId({ addon: fakeAddon })).toEqual(
          `editable-collection-addon-${fakeAddon.id}`,
        );
      });
    });
  });

  describe('Tests for CollectionManager', () => {
    const getErrorHandlerId = (slug = '') =>
      `src/amo/components/CollectionManager/index.js-collection-${slug}`;

    const accessEditDetailsScreen = async () => {
      await clickEditButton();
      await userEvent.click(
        screen.getByRole('link', { name: 'Edit collection details' }),
      );
    };

    const typeName = async (name) => {
      const input = screen.getByRole('textbox', { name: 'Collection name' });
      await userEvent.clear(input);
      await userEvent.type(input, name);
    };

    const typeDescription = async (description) => {
      const input = screen.getByRole('textbox', { name: 'Description' });
      await userEvent.clear(input);
      await userEvent.type(input, description);
    };

    const typeSlug = async (slug) => {
      const input = screen.getByRole('textbox', { name: 'Custom URL' });
      await userEvent.clear(input);
      await userEvent.type(input, slug);
    };

    const fillInDetailsScreen = async ({ description, name, slug }) => {
      await typeName(name);
      await typeDescription(description);
      await typeSlug(slug);
    };

    const expectCancelButtonToBeDisabled = (disabled) => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty(
        'disabled',
        disabled,
      );
      return true;
    };

    const expectSaveButtonToBeDisabled = (disabled) => {
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toHaveProperty('disabled', disabled);
      return true;
    };

    const expectButtonDisabledStatus = ({
      cancelIsDisabled,
      saveIsDisabled,
    }) => {
      expectCancelButtonToBeDisabled(cancelIsDisabled);
      expectSaveButtonToBeDisabled(saveIsDisabled);
      return true;
    };

    it('populates the edit form with collection data', async () => {
      const description = 'OG description';
      const name = 'OG name';
      renderWithCollectionForSignedInUser({
        detailProps: { description, name },
      });

      await accessEditDetailsScreen();

      const expectedUrlPrefix = `${config.get(
        'apiHost',
      )}/${lang}/${clientApp}/collections/${defaultUserId}/`;
      expect(
        screen.getByRole('textbox', { name: 'Collection name' }),
      ).toHaveValue(name);
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        description,
      );
      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        defaultSlug,
      );
      expect(screen.getByTitle(expectedUrlPrefix)).toHaveTextContent(
        expectedUrlPrefix,
      );
      expectSaveButtonToBeDisabled(true);
    });

    it('does not populate form when updating to the same collection', async () => {
      renderWithCollectionForSignedInUser({
        detailProps: {
          description: 'First description',
          name: 'First name',
        },
      });

      await accessEditDetailsScreen();

      const description = 'User typed description';
      const name = 'User typed name';
      const slug = 'user-typed-slug';

      await fillInDetailsScreen({ description, name, slug });

      expect(
        screen.getByRole('textbox', { name: 'Collection name' }),
      ).toHaveValue(name);
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        description,
      );
      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        slug,
      );

      // Simulate how a mounted component will get updated with the same
      // collection. E.G. This happens when pressing the submit button.
      await userEvent.click(
        screen.getByRole('button', { name: 'Save changes' }),
      );

      // Make sure the internal state is preserved.
      expect(
        screen.getByRole('textbox', { name: 'Collection name' }),
      ).toHaveValue(name);
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        description,
      );
    });

    it('creates a collection on submit', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderInAddMode();

      const name = 'A collection name';
      const description = 'A collection description';
      const slug = 'collection-slug';

      await fillInDetailsScreen({ description, name, slug });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create collection' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        createCollection({
          defaultLocale: lang,
          description: { [lang]: description },
          errorHandlerId: getErrorHandlerId(),
          name: { [lang]: name },
          slug,
          userId: defaultUserId,
        }),
      );
    });

    it('creates a collection with an add-on on submit', async () => {
      const addonId = '123';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderInAddMode({ withAddonId: addonId });

      const name = 'A collection name';
      const description = 'A collection description';
      const slug = 'collection-slug';

      await fillInDetailsScreen({ description, name, slug });

      await userEvent.click(
        screen.getByRole('button', { name: 'Create collection' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        createCollection({
          defaultLocale: lang,
          description: { [lang]: description },
          errorHandlerId: getErrorHandlerId(),
          includeAddonId: addonId,
          name: { [lang]: name },
          slug,
          userId: defaultUserId,
        }),
      );
    });

    it('updates the collection on submit', async () => {
      renderWithCollectionForSignedInUser({
        location: `${defaultLocation}?page=1`,
      });
      const dispatch = jest.spyOn(store, 'dispatch');

      await accessEditDetailsScreen();

      // Fill in the form with new values.
      const name = 'A new name';
      const description = 'A new description';
      const slug = 'new-slug';

      await fillInDetailsScreen({ description, name, slug });

      await userEvent.click(
        screen.getByRole('button', { name: 'Save changes' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        updateCollection({
          collectionSlug: defaultSlug,
          defaultLocale: lang,
          description: { [lang]: description },
          errorHandlerId: getErrorHandlerId(defaultSlug),
          filters: {
            page: '1',
            collectionSort: COLLECTION_SORT_DATE_ADDED_DESCENDING,
          },
          name: { [lang]: name },
          slug,
          userId: defaultUserId,
        }),
      );
    });

    it('renders an error', async () => {
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultSlug),
        message,
        store,
      });

      expect(await screen.findByText(message)).toBeInTheDocument();
    });

    it('disables submit button when the name is blank', async () => {
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      await userEvent.clear(
        screen.getByRole('textbox', { name: 'Collection name' }),
      );

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables submit button when the name is spaces', async () => {
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      await typeName('     ');

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables submit button when the slug is blank', async () => {
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      await userEvent.clear(
        screen.getByRole('textbox', { name: 'Custom URL' }),
      );

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables submit button when the slug is spaces', async () => {
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      await typeSlug('     ');

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables and enables form buttons when modification status changes', async () => {
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      // Cancel should default to enabled, and Save to disabled.
      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();

      // Enter a value for name in order to enable submit button.
      await typeName(`${defaultCollectionName}-changed`);

      // Buttons should be enabled now.
      expectButtonDisabledStatus({
        cancelIsDisabled: false,
        saveIsDisabled: false,
      });

      // beginCollectionModification is dispatched by a saga, and by default
      // sagas do not run during tests, so we are dispatching this manually to
      // change the state.
      store.dispatch(beginCollectionModification());

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty(
          'disabled',
          true,
        ),
      );

      // Buttons should be disabled now.
      expectButtonDisabledStatus({
        cancelIsDisabled: true,
        saveIsDisabled: true,
      });
    });

    it('enables and disables the submit button when form data is modified', async () => {
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      // Save should be disabled by default.
      expect(expectSaveButtonToBeDisabled(true)).toBeTruthy();

      await typeName(`${defaultCollectionName}-changed`);
      expectSaveButtonToBeDisabled(false);

      await typeName(defaultCollectionName);
      expectSaveButtonToBeDisabled(true);

      await typeDescription(`${defaultCollectionDescription}-changed`);
      expectSaveButtonToBeDisabled(false);

      await typeDescription(defaultCollectionDescription);
      expectSaveButtonToBeDisabled(true);

      await typeSlug(`${defaultSlug}-changed`);
      expectSaveButtonToBeDisabled(false);

      await typeSlug(defaultSlug);
      expectSaveButtonToBeDisabled(true);
    });

    it('trims leading and trailing spaces from slug and name before submitting', async () => {
      const name = 'trishul';
      const slug = 'trishul';
      renderWithCollectionForSignedInUser({
        detailProps: { name, slug },
        slug,
      });
      const dispatch = jest.spyOn(store, 'dispatch');

      await accessEditDetailsScreen();

      // Enter in collection name and slug with trailing and leading spaces.
      await typeName(`  ${name}   `);
      await typeSlug(`  ${slug}   `);

      await userEvent.click(
        screen.getByRole('button', { name: 'Save changes' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        updateCollection({
          collectionSlug: slug,
          defaultLocale: lang,
          description: { [lang]: defaultCollectionDescription },
          errorHandlerId: getErrorHandlerId(slug),
          filters: {
            page: '1',
            collectionSort: COLLECTION_SORT_DATE_ADDED_DESCENDING,
          },
          name: { [lang]: name },
          slug,
          userId: defaultUserId,
        }),
      );
    });

    it('autofills slug when name is entered while creating collection', async () => {
      const name = "trishul's collection";
      renderInAddMode();

      await typeName(name);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('does not autofill slug when custom slug is entered while creating collection', async () => {
      const name = "trishul's collection";
      const slug = 'trishul';
      renderInAddMode();

      await typeSlug(slug);
      await typeName(name);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        slug,
      );
    });

    it('autofills slug with trimmed collection name', async () => {
      const name = "trishul's collection";
      renderInAddMode();

      await typeName(`  ${name}  `);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('does not allow consecutive hyphen while autofilling slug', async () => {
      const name = "trishul's   collection";
      renderInAddMode();

      await typeName(`  ${name}  `);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('does not update slug if event value is undefined', async () => {
      const name = "trishul's collection";
      renderInAddMode();

      await typeName(name);
      fireEvent.change(screen.getByRole('textbox', { name: 'Custom URL' }), {
        target: { value: undefined },
      });

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('allows a blank description', async () => {
      const name = 'My collection';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderInAddMode();

      await typeName(name);
      await userEvent.clear(
        screen.getByRole('textbox', { name: 'Description' }),
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'Create collection' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        createCollection({
          defaultLocale: lang,
          description: { [lang]: '' },
          errorHandlerId: getErrorHandlerId(),
          filters: {
            page: '1',
            collectionSort: COLLECTION_SORT_DATE_ADDED_DESCENDING,
          },
          name: { [lang]: name },
          slug: 'My-collection',
          userId: defaultUserId,
        }),
      );
    });

    it('dispatches finishEditingCollectionDetails on cancel when editing', async () => {
      renderWithCollectionForSignedInUser();
      const dispatch = jest.spyOn(store, 'dispatch');

      await accessEditDetailsScreen();

      const button = screen.getByRole('button', {
        name: 'Cancel',
      });
      const clickEvent = createEvent.click(button);
      const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
      const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

      fireEvent(button, clickEvent);
      expect(preventDefaultWatcher).toHaveBeenCalled();
      expect(stopPropagationWatcher).toHaveBeenCalled();

      expect(dispatch).toHaveBeenCalledWith(finishEditingCollectionDetails());
    });

    it('calls history.push() when creating', async () => {
      renderInAddMode();
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(pushSpy).toHaveBeenCalledWith(
        `/${lang}/${clientApp}/collections/`,
      );
    });

    it('populates form state when updating to a new collection', async () => {
      renderInAddMode();

      _loadCurrentCollection();

      await changeLocation({
        history,
        pathname: defaultLocation,
      });

      await accessEditDetailsScreen();

      expect(
        screen.getByRole('textbox', { name: 'Collection name' }),
      ).toHaveValue(defaultCollectionName);
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        defaultCollectionDescription,
      );
    });

    it('populates form state when switching collections', async () => {
      const secondDescription = 'second description';
      const secondName = 'second name';
      const slug = 'secondSlug';
      renderWithCollectionForSignedInUser();

      await accessEditDetailsScreen();

      // This simulates when a user moves from editing one collection to
      // editing another collection.
      await changeLocation({
        history,
        pathname: getLocation({ slug }),
      });
      _loadCurrentCollection({
        detail: createFakeCollectionDetail({
          authorId: defaultUserId,
          description: secondDescription,
          name: secondName,
          slug,
        }),
      });

      await waitFor(() =>
        expect(
          screen.getByRole('textbox', { name: 'Collection name' }),
        ).toHaveValue(secondName),
      );
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        secondDescription,
      );
    });

    describe('extractId', () => {
      it('generates an ID without a collection', () => {
        expect(collectionManagerExtractId({ collection: null })).toEqual(
          'collection-',
        );
      });

      it('generates an ID with a collection', () => {
        const collection = createInternalCollectionWithLang({
          detail: createFakeCollectionDetail({
            slug: 'some-slug',
          }),
        });
        expect(collectionManagerExtractId({ collection })).toEqual(
          'collection-some-slug',
        );
      });
    });
  });

  describe('Tests for CollectionDetails', () => {
    it('renders collection details', () => {
      const authorName = 'Collection author';
      const description = 'Collection description';
      const modified = 'Jan 1, 1999';
      const name = 'Collection Name';
      const addons = [
        createFakeCollectionAddon({ addon: { ...fakeAddon, id: 1 } }),
        createFakeCollectionAddon({ addon: { ...fakeAddon, id: 2 } }),
      ];

      renderWithCollection({
        addons,
        detailProps: {
          authorName,
          count: addons.length,
          description,
          modified: new Date(modified),
          name,
        },
      });

      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
      const terms = screen.getAllByRole('term');
      const definitions = screen.getAllByRole('definition');
      expect(terms[0]).toHaveTextContent('Add-ons');
      expect(definitions[0]).toHaveTextContent(addons.length);
      expect(terms[1]).toHaveTextContent('Creator');
      expect(definitions[1]).toHaveTextContent(authorName);
      expect(terms[2]).toHaveTextContent('Last updated');
      expect(definitions[2]).toHaveTextContent(modified);
    });

    it('can handle a blank name', () => {
      renderWithCollection({ detailProps: { name: null } });

      expect(
        screen.getByRole('heading', {
          name: collectionName({ name: null, i18n: fakeI18n() }),
        }),
      ).toBeInTheDocument();
    });

    it('renders loading indicators when there is no collection', () => {
      render();

      expect(
        within(screen.getByClassName('CollectionDetails')).getAllByRole(
          'alert',
        ),
      ).toHaveLength(5);
    });

    it('does not render buttons when there is no collection', () => {
      dispatchSignInActionsWithStore({ store, userId: defaultUserId });
      render();

      expect(
        screen.queryByRole('link', { name: 'Edit this collection' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Edit collection details' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Back to collection' }),
      ).not.toBeInTheDocument();
    });

    it('switches into collection edit mode when the edit button is clicked', async () => {
      renderWithCollectionForSignedInUser();

      await clickEditButton();

      expect(
        screen.queryByRole('link', { name: 'Edit this collection' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Edit collection details' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Back to collection' }),
      ).toHaveAttribute(
        'href',
        `${defaultLocation}?page=1&collection_sort=-added`,
      );
    });

    it('switches into collection details edit mode when the edit details button is clicked', async () => {
      renderWithCollectionForSignedInUser();

      await clickEditButton();

      const link = screen.getByRole('link', {
        name: 'Edit collection details',
      });
      const clickEvent = createEvent.click(link);
      const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
      const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

      fireEvent(link, clickEvent);
      expect(preventDefaultWatcher).toHaveBeenCalled();
      expect(stopPropagationWatcher).toHaveBeenCalled();

      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeInTheDocument();
    });
  });

  describe('Tests for CollectionDetailsCard', () => {
    it('renders an edit button if the current user is the author', () => {
      renderWithCollectionForSignedInUser();

      expect(
        screen.getByRole('link', { name: 'Edit this collection' }),
      ).toHaveAttribute(
        'href',
        `${defaultLocation}edit/?page=1&collection_sort=-added`,
      );
    });

    it('does not render an edit button if the current user is not the author', () => {
      dispatchSignInActionsWithStore({ store, userId: defaultUserId + 1 });
      renderWithCollection();

      expect(
        screen.queryByRole('link', { name: 'Edit this collection' }),
      ).not.toBeInTheDocument();
    });

    it('renders an edit button for a mozilla collection when user has the `Admin:Curation` permission', () => {
      dispatchSignInActionsWithStore({
        store,
        userId: defaultUserId,
        userProps: {
          permissions: [MOZILLA_COLLECTIONS_EDIT],
        },
      });
      renderWithCollection({
        detailProps: { authorId: mozillaUserId },
        userId: mozillaUserId,
      });

      expect(
        screen.getByRole('link', { name: 'Edit this collection' }),
      ).toBeInTheDocument();
    });

    it('does not render an edit button for a mozilla collection when user does not have the `Admin:Curation` permission', () => {
      dispatchSignInActionsWithStore({ store, userId: defaultUserId });
      renderWithCollection({
        detail: createFakeCollectionDetail({ authorId: mozillaUserId }),
        userId: mozillaUserId,
      });

      expect(
        screen.queryByRole('link', { name: 'Edit this collection' }),
      ).not.toBeInTheDocument();
    });

    it('renders an edit button for the Featured Themes collection when user has only the `Collections:Contribute` permission', () => {
      dispatchSignInActionsWithStore({
        store,
        userId: defaultUserId,
        userProps: {
          permissions: [FEATURED_THEMES_COLLECTION_EDIT],
        },
      });
      renderWithCollection({
        detailProps: {
          authorId: mozillaUserId,
          slug: FEATURED_THEMES_COLLECTION_SLUG,
        },
        slug: FEATURED_THEMES_COLLECTION_SLUG,
        userId: mozillaUserId,
      });

      expect(
        screen.getByRole('link', { name: 'Edit this collection' }),
      ).toBeInTheDocument();
    });

    it('does not render an edit button for the Featured Themes collection when user does not have the `Collections:Contribute` permission', () => {
      dispatchSignInActionsWithStore({ store, userId: defaultUserId });
      renderWithCollection({
        detail: createFakeCollectionDetail({
          authorId: mozillaUserId,
          slug: FEATURED_THEMES_COLLECTION_SLUG,
        }),
        userId: mozillaUserId,
      });

      expect(
        screen.queryByRole('link', { name: 'Edit this collection' }),
      ).not.toBeInTheDocument();
    });
  });

  it('shows an abuse report button', () => {
    renderWithCollection();

    expect(
      screen.getByRole('link', {
        name: 'Report this collection',
      }),
    ).toBeInTheDocument();
  });

  it('does not show an abuse report button when the collection is not loaded yet', () => {
    render();

    expect(
      screen.queryByRole('link', {
        name: 'Report this collection',
      }),
    ).not.toBeInTheDocument();
  });

  it('does not show an abuse report button for a owner', () => {
    renderWithCollectionForSignedInUser();

    expect(
      screen.queryByRole('link', {
        name: 'Report this collection',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders a confirmation message when the collection has been reported', () => {
    const collectionId = 222222;
    store.dispatch(loadCollectionAbuseReport({ collectionId }));

    renderWithCollection({ detailProps: { id: collectionId } });

    expect(
      screen.queryByRole('link', {
        name: 'Report this collection',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('You reported this collection'),
    ).toBeInTheDocument();
  });
});
