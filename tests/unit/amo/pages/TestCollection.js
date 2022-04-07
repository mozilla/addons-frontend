import config from 'config';
import { createEvent, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  MOZILLA_COLLECTIONS_EDIT,
} from 'amo/constants';
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
import {
  SEND_SERVER_REDIRECT,
  sendServerRedirect,
} from 'amo/reducers/redirectTo';
import {
  DEFAULT_ADDON_PLACEHOLDER_COUNT,
  extractId,
} from 'amo/pages/Collection';
import {
  createFakeAutocompleteResult,
  createFakeCollectionAddon,
  createFailedErrorHandler,
  createFakeCollectionDetail,
  createInternalCollectionWithLang,
  createLocalizedString,
  createFakeCollectionAddonsListResponse,
  createHistory,
  dispatchAutocompleteResults,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAddon,
  fakeI18n,
  fakePreview,
  getElement,
  onLocationChanged,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
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
  const lang = 'en-US';
  const mozillaUserId = config.get('mozillaUserId');

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
  });

  afterEach(() => {
    jest.useRealTimers();
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
    history,
    location,
    slug = defaultSlug,
    userId = defaultUserId,
  } = {}) => {
    const initialEntry = location || getLocation({ editing, slug, userId });

    const renderOptions = {
      history:
        history ||
        createHistory({
          initialEntries: [initialEntry],
        }),
      store,
    };
    return defaultRender(renderOptions);
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
    history,
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

    return render({ editing, history, location, slug, userId });
  };

  const renderWithCollectionForSignedInUser = ({
    addons,
    addonsResponse,
    detailProps = {},
    editing,
    history,
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
      history,
      location,
      slug,
      userId,
    });
  };

  const renderInAddMode = ({ history, loggedIn = true, withAddonId } = {}) => {
    if (loggedIn) {
      dispatchSignInActionsWithStore({ store, userId: defaultUserId });
    }
    return render({
      history:
        history ||
        createHistory({
          initialEntries: [
            `/${lang}/${clientApp}/collections/add/${
              withAddonId ? `?include_addon_id=${withAddonId}` : ''
            }`,
          ],
        }),
    });
  };

  const _addonAddedToCollection = () => {
    store.dispatch(
      addonAddedToCollection({
        addonId: 123,
        collectionId: defaultCollectionId,
        userId: defaultUserId,
      }),
    );
  };

  const _addonRemovedFromCollection = () => {
    store.dispatch(addonRemovedFromCollection());
  };

  const clickEditButton = () =>
    userEvent.click(screen.getByRole('link', { name: 'Edit this collection' }));

  const selectAnAddon = ({ addonName, id }) => {
    userEvent.type(
      screen.getByPlaceholderText(
        'Find an add-on to include in this collection',
      ),
      'test',
    );
    const externalSuggestion = createFakeAutocompleteResult({
      name: addonName,
      id,
    });
    dispatchAutocompleteResults({
      results: [externalSuggestion],
      store,
    });
    userEvent.click(screen.getByText(addonName));
  };

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

  it('does not dispatch any loading actions when switching to edit mode', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollectionForSignedInUser();

    clickEditButton();

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

  it('does not dispatch any loading actions when location has not changed', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollection();

    store.dispatch(
      onLocationChanged({
        pathname: defaultLocation,
      }),
    );

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

  it('dispatches fetchCurrentCollection when location pathname has changed', () => {
    const slug = `${defaultSlug}-new`;
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollection();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ slug }),
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId({ slug }),
        filters: defaultFilters,
        slug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches fetchCurrentCollectionPage when page has changed', () => {
    const page = '2';
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollection({ location: `${defaultLocation}?page=1` });

    store.dispatch(
      onLocationChanged({
        pathname: `${defaultLocation}?page=${page}`,
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollectionPage({
        errorHandlerId: getCollectionPageErrorHandlerId({ page }),
        filters: { ...defaultFilters, page },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches fetchCurrentCollectionPage when sort has changed', () => {
    const sort = COLLECTION_SORT_NAME;
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollection();

    store.dispatch(
      onLocationChanged({
        pathname: `${defaultLocation}?collection_sort=${sort}`,
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollectionPage({
        errorHandlerId: getCollectionPageErrorHandlerId(),
        filters: { ...defaultFilters, collectionSort: sort },
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches fetchCurrentCollection when user param has changed', () => {
    const userId = defaultUserId + 1;
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollection();

    store.dispatch(onLocationChanged({ pathname: getLocation({ userId }) }));

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: getCollectionPageErrorHandlerId({ userId }),
        filters: defaultFilters,
        slug: defaultSlug,
        userId,
      }),
    );
  });

  it('dispatches fetchCurrentCollection when slug param has changed', () => {
    const slug = `${defaultSlug}-new`;
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollection();

    store.dispatch(onLocationChanged({ pathname: getLocation({ slug }) }));

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

    expect(screen.getByRole('link', { name: addonName })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/addon/${fakeAddon.slug}/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=collection`,
    );
    expect(screen.getByAltText(addonName)).toHaveAttribute(
      'src',
      fakePreview.image_url,
    );
  });

  it('sets placeholder counts for the AddonsCard as expected', () => {
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
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Switch to a different slug, which will initiate a new loading state.
    store.dispatch(
      onLocationChanged({
        pathname: getLocation({ slug: `${defaultSlug}-new` }),
      }),
    );

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

  it('renders loading indicator on add-ons when fetching next page', () => {
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

    userEvent.click(screen.getByRole('link', { name: 'Next' }));

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

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent(
      `${defaultCollectionName} – Add-ons for Firefox (en-US)`,
    );
  });

  it('renders an HTML title for a collection with a missing name', async () => {
    renderWithCollection({ detailProps: { name: null } });

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent(
      `${collectionName({
        name: null,
        i18n: fakeI18n(),
      })} – Add-ons for Firefox (en-US)`,
    );
  });

  it('renders the default HTML title when there is no collection loaded', async () => {
    render();

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent(
      'Add-ons for Firefox (en-US)',
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
    renderWithCollection({ location: `${defaultLocation}edit/` });

    expect(
      screen.getByRole('link', { name: 'Log in to edit this collection' }),
    ).toBeInTheDocument();

    // Make sure the form was not rendered.
    expect(
      screen.queryByRole('textbox', { name: 'Collection name' }),
    ).not.toBeInTheDocument();
  });

  it('does not update the page when removeAddon is called and there are still addons to show on the current page', () => {
    const numberOfAddons = 5;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: numberOfAddons,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const page = '2';
    const history = createHistory({
      initialEntries: [`${defaultLocation}edit/?page=${page}`],
    });
    const pushSpy = jest.spyOn(history, 'push');
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollectionForSignedInUser({
      addonsResponse,
      history,
    });

    userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

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

  it("does not update the page when removeAddon is called and the current page isn't the last page", () => {
    const numberOfAddons = 5;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: numberOfAddons,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const page = '1';
    const history = createHistory({
      initialEntries: [`${defaultLocation}edit/?page=${page}`],
    });
    const pushSpy = jest.spyOn(history, 'push');
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollectionForSignedInUser({
      addonsResponse,
      history,
    });

    userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

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

  it('updates the page when removeAddon removes the last addon from the current page', () => {
    const numberOfAddons = 1;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 2,
      pageSize: numberOfAddons,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const page = '2';
    const sort = COLLECTION_SORT_DATE_ADDED_DESCENDING;
    const history = createHistory({
      initialEntries: [
        `${defaultLocation}edit/?page=${page}&collection_sort=${sort}`,
      ],
    });
    const pushSpy = jest.spyOn(history, 'push');
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithCollectionForSignedInUser({ addonsResponse, history });

    userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

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
      pathname: `${defaultLocation}edit/`,
      query: {
        collection_sort: sort,
        page: '1',
      },
    });
  });

  it('dispatches deleteCollection when the Delete collection button is clicked and confirmed', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithCollectionForSignedInUser();

    const button = screen.getByRole('button', {
      name: 'Delete this collection',
    });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    fireEvent(button, clickEvent);

    userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(preventDefaultWatcher).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      deleteCollection({
        errorHandlerId: getCollectionPageErrorHandlerId(),
        slug: defaultSlug,
        userId: defaultUserId,
      }),
    );
  });

  it('sends a server redirect when userId parameter is not a numeric ID', () => {
    const authorId = 19;
    const authorUsername = 'john';
    const dispatch = jest.spyOn(store, 'dispatch');

    _loadCurrentCollection({
      detail: _createFakeCollectionDetail({
        authorId,
        authorUsername,
      }),
    });

    render({ userId: authorUsername });

    expect(dispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/collections/${authorId}/${defaultSlug}/`,
      }),
    );
  });

  it('sends a server redirect when slug parameter case is not the same as the collection slug', () => {
    const dispatch = jest.spyOn(store, 'dispatch');

    _loadCurrentCollection();

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
      expect(getElement('meta[name="description"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="description"]')).toHaveAttribute(
      'content',
      [
        'Download and create Firefox collections to keep track of favorite extensions and themes.',
        `Explore the ${name}—${description}.`,
      ].join(' '),
    );
  });

  it('renders a "description" meta tag without a collection description', async () => {
    const name = 'my super collection';
    const description = '';
    renderWithCollection({ detailProps: { name, description } });

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="description"]')).toHaveAttribute(
      'content',
      [
        'Download and create Firefox collections to keep track of favorite extensions and themes.',
        `Explore the ${name}.`,
      ].join(' '),
    );
  });

  it('renders a "description" meta tag for a collection with a missing name', async () => {
    const name = null;
    const description = '';

    renderWithCollection({ detailProps: { name, description } });

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="description"]')).toHaveAttribute(
      'content',
      [
        'Download and create Firefox collections to keep track of favorite extensions and themes.',
        `Explore the ${collectionName({
          name,
          i18n: fakeI18n(),
        })}.`,
      ].join(' '),
    );
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

    it('switches into collection edit mode when the edit button is clicked', () => {
      renderWithCollectionForSignedInUser();

      clickEditButton();

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

    it('switches into collection details edit mode when the edit details button is clicked', () => {
      renderWithCollectionForSignedInUser();

      clickEditButton();

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

  describe('Tests for CollectionManager', () => {
    const getErrorHandlerId = (slug = '') =>
      `src/amo/components/CollectionManager/index.js-collection-${slug}`;

    const accessEditDetailsScreen = () => {
      clickEditButton();
      userEvent.click(
        screen.getByRole('link', { name: 'Edit collection details' }),
      );
    };

    const typeName = (name) =>
      userEvent.type(
        screen.getByRole('textbox', { name: 'Collection name' }),
        `{selectall}{del}${name}`,
      );

    const typeDescription = (description) =>
      userEvent.type(
        screen.getByRole('textbox', { name: 'Description' }),
        `{selectall}{del}${description}`,
      );

    const typeSlug = (slug) =>
      userEvent.type(
        screen.getByRole('textbox', { name: 'Custom URL' }),
        `{selectall}{del}${slug}`,
      );

    const fillInDetailsScreen = ({ description, name, slug }) => {
      typeName(name);
      typeDescription(description);
      typeSlug(slug);
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

    it('populates the edit form with collection data', () => {
      const description = 'OG description';
      const name = 'OG name';
      renderWithCollectionForSignedInUser({
        detailProps: { description, name },
      });

      accessEditDetailsScreen();

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

    it('does not populate form when updating to the same collection', () => {
      renderWithCollectionForSignedInUser({
        detailProps: {
          description: 'First description',
          name: 'First name',
        },
      });

      accessEditDetailsScreen();

      const description = 'User typed description';
      const name = 'User typed name';
      const slug = 'user-typed-slug';

      fillInDetailsScreen({ description, name, slug });

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
      userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      // Make sure the internal state is preserved.
      expect(
        screen.getByRole('textbox', { name: 'Collection name' }),
      ).toHaveValue(name);
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        description,
      );
    });

    it('creates a collection on submit', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderInAddMode();

      const name = 'A collection name';
      const description = 'A collection description';
      const slug = 'collection-slug';

      fillInDetailsScreen({ description, name, slug });

      userEvent.click(
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

    it('creates a collection with an add-on on submit', () => {
      const addonId = '123';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderInAddMode({ withAddonId: addonId });

      const name = 'A collection name';
      const description = 'A collection description';
      const slug = 'collection-slug';

      fillInDetailsScreen({ description, name, slug });

      userEvent.click(
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

    it('updates the collection on submit', () => {
      renderWithCollectionForSignedInUser({
        location: `${defaultLocation}?page=1`,
      });
      const dispatch = jest.spyOn(store, 'dispatch');

      accessEditDetailsScreen();

      // Fill in the form with new values.
      const name = 'A new name';
      const description = 'A new description';
      const slug = 'new-slug';

      fillInDetailsScreen({ description, name, slug });

      userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

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

    it('renders an error', () => {
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultSlug),
        message,
        store,
      });

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('disables submit button when the name is blank', () => {
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      userEvent.type(
        screen.getByRole('textbox', { name: 'Collection name' }),
        `{selectall}{del}`,
      );

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables submit button when the name is spaces', () => {
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      userEvent.type(
        screen.getByRole('textbox', { name: 'Collection name' }),
        `{selectall}{del}     `,
      );

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables submit button when the slug is blank', () => {
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      userEvent.type(
        screen.getByRole('textbox', { name: 'Custom URL' }),
        `{selectall}{del}`,
      );

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables submit button when the slug is spaces', () => {
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      userEvent.type(
        screen.getByRole('textbox', { name: 'Custom URL' }),
        `{selectall}{del}     `,
      );

      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();
    });

    it('disables and enables form buttons when modification status changes', () => {
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      // Cancel should default to enabled, and Save to disabled.
      expect(
        expectButtonDisabledStatus({
          cancelIsDisabled: false,
          saveIsDisabled: true,
        }),
      ).toBeTruthy();

      // Enter a value for name in order to enable submit button.
      userEvent.type(
        screen.getByRole('textbox', { name: 'Collection name' }),
        `{selectall}{del}${defaultCollectionName}-changed`,
      );

      // Buttons should be enabled now.
      expectButtonDisabledStatus({
        cancelIsDisabled: false,
        saveIsDisabled: false,
      });

      // beginCollectionModification is dispatched by a saga, and by default
      // sagas do not run during tests, so we are dispatching this manually to
      // change the state.
      store.dispatch(beginCollectionModification());

      // Buttons should be disabled now.
      expectButtonDisabledStatus({
        cancelIsDisabled: true,
        saveIsDisabled: true,
      });
    });

    it('enables and disables the submit button when form data is modified', () => {
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      // Save should be disabled by default.
      expect(expectSaveButtonToBeDisabled(true)).toBeTruthy();

      typeName(`${defaultCollectionName}-changed`);
      expectSaveButtonToBeDisabled(false);

      typeName(defaultCollectionName);
      expectSaveButtonToBeDisabled(true);

      typeDescription(`${defaultCollectionDescription}-changed`);
      expectSaveButtonToBeDisabled(false);

      typeDescription(defaultCollectionDescription);
      expectSaveButtonToBeDisabled(true);

      typeSlug(`${defaultSlug}-changed`);
      expectSaveButtonToBeDisabled(false);

      typeSlug(defaultSlug);
      expectSaveButtonToBeDisabled(true);
    });

    it('trims leading and trailing spaces from slug and name before submitting', () => {
      const name = 'trishul';
      const slug = 'trishul';
      renderWithCollectionForSignedInUser({
        detailProps: { name, slug },
        slug,
      });
      const dispatch = jest.spyOn(store, 'dispatch');

      accessEditDetailsScreen();

      // Enter in collection name and slug with trailing and leading spaces.
      typeName(`  ${name}   `);
      typeSlug(`  ${slug}   `);

      userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

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

    it('autofills slug when name is entered while creating collection', () => {
      const name = "trishul's collection";
      renderInAddMode();

      typeName(name);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('does not autofill slug when custom slug is entered while creating collection', () => {
      const name = "trishul's collection";
      const slug = 'trishul';
      renderInAddMode();

      typeSlug(slug);
      typeName(name);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        slug,
      );
    });

    it('autofills slug with trimmed collection name', () => {
      const name = "trishul's collection";
      renderInAddMode();

      typeName(`  ${name}  `);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('does not allow consecutive hyphen while autofilling slug', () => {
      const name = "trishul's   collection";
      renderInAddMode();

      typeName(`  ${name}  `);

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('does not update slug if event value is undefined', () => {
      const name = "trishul's collection";
      renderInAddMode();

      typeName(name);
      fireEvent.change(screen.getByRole('textbox', { name: 'Custom URL' }), {
        target: { value: undefined },
      });

      expect(screen.getByRole('textbox', { name: 'Custom URL' })).toHaveValue(
        'trishul-s-collection',
      );
    });

    it('allows a blank description', () => {
      const name = 'My collection';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderInAddMode();

      typeName(name);
      typeDescription('');

      userEvent.click(
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

    it('dispatches finishEditingCollectionDetails on cancel when editing', () => {
      renderWithCollectionForSignedInUser();
      const dispatch = jest.spyOn(store, 'dispatch');

      accessEditDetailsScreen();

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

    it('calls history.push() when creating', () => {
      const history = createHistory({
        initialEntries: [`/${lang}/${clientApp}/collections/add/`],
      });
      renderInAddMode({ history });
      const pushSpy = jest.spyOn(history, 'push');

      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(pushSpy).toHaveBeenCalledWith(
        `/${lang}/${clientApp}/collections/`,
      );
    });

    it('populates form state when updating to a new collection', () => {
      renderInAddMode();

      _loadCurrentCollection();

      store.dispatch(
        onLocationChanged({
          pathname: defaultLocation,
        }),
      );

      accessEditDetailsScreen();

      expect(
        screen.getByRole('textbox', { name: 'Collection name' }),
      ).toHaveValue(defaultCollectionName);
      expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue(
        defaultCollectionDescription,
      );
    });

    it('populates form state when switching collections', () => {
      const secondDescription = 'second description';
      const secondName = 'second name';
      const slug = 'secondSlug';
      renderWithCollectionForSignedInUser();

      accessEditDetailsScreen();

      // This simulates when a user moves from editing one collection to
      // editing another collection.
      store.dispatch(onLocationChanged({ pathname: getLocation({ slug }) }));
      _loadCurrentCollection({
        detail: createFakeCollectionDetail({
          authorId: defaultUserId,
          description: secondDescription,
          name: secondName,
          slug,
        }),
      });

      expect(
        screen.getByRole('textbox', { name: 'Collection name' }),
      ).toHaveValue(secondName);
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
        slug: FEATURED_THEMES_COLLECTION_SLUG,
        userId: mozillaUserId,
      });

      expect(
        screen.queryByRole('link', { name: 'Edit this collection' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for CollectionAddAddon', () => {
    const getErrorHandlerId = (id = '') =>
      `src/amo/components/CollectionAddAddon/index.js-collection${id}`;

    it('renders an error', () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultCollectionId),
        message,
        store,
      });

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('dispatches addAddonToCollection when selecting an add-on', () => {
      const addonName = 'uBlock Origin';
      const id = 123;
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithCollectionForSignedInUser({ editing: true });

      selectAnAddon({ addonName, id });

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
      jest.useFakeTimers();
      renderWithCollectionForSignedInUser({ editing: true });

      expect(screen.queryByText('Added to collection')).not.toBeInTheDocument();

      _addonAddedToCollection();

      expect(screen.getByText('Added to collection')).toBeInTheDocument();
      expect(screen.getByClassName('Notice-success')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter',
      );

      // Trigger the setTimeout behavior.
      jest.advanceTimersByTime(MESSAGE_RESET_TIME);

      // The Notice element will still be present, but the fade transition,
      // controlled by CSSTransition should have been started.
      expect(screen.getByClassName('Notice-success')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter-done',
      );
    });

    it('displays a notification for 5 seconds after an add-on has been removed', () => {
      jest.useFakeTimers();
      renderWithCollectionForSignedInUser({ editing: true });

      expect(
        screen.queryByText('Removed from collection'),
      ).not.toBeInTheDocument();

      _addonRemovedFromCollection();

      expect(screen.getByText('Removed from collection')).toBeInTheDocument();
      expect(screen.getByClassName('Notice-generic')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter',
      );

      // Trigger the setTimeout behavior.
      jest.advanceTimersByTime(MESSAGE_RESET_TIME);

      // The Notice element will still be present, but the fade transition,
      // controlled by CSSTransition should have been started.
      expect(screen.getByClassName('Notice-generic')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter-done',
      );
    });

    it('clears the errorHandler when an add-on is added', () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultCollectionId),
        message,
        store,
      });

      expect(screen.getByText(message)).toBeInTheDocument();

      _addonAddedToCollection();

      expect(screen.queryByText(message)).not.toBeInTheDocument();
    });

    it('clears the errorHandler when an add-on is removed', () => {
      renderWithCollectionForSignedInUser({ editing: true });

      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(defaultCollectionId),
        message,
        store,
      });

      expect(screen.getByText(message)).toBeInTheDocument();

      _addonRemovedFromCollection();

      expect(screen.queryByText(message)).not.toBeInTheDocument();
    });

    it('removes the notification after a new add-on has been selected', () => {
      const addonName = 'uBlock Origin';
      const id = 123;
      renderWithCollectionForSignedInUser({ editing: true });

      expect(screen.queryByText('Added to collection')).not.toBeInTheDocument();

      _addonAddedToCollection();

      expect(screen.getByText('Added to collection')).toBeInTheDocument();
      expect(screen.getByClassName('Notice-success')).toHaveClass(
        'CollectionAddAddon-noticePlaceholder-transition-enter',
      );

      selectAnAddon({ addonName, id });

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

  describe('Tests for EditableCollectionAddon', () => {
    const errorHandlerId =
      'src/amo/components/EditableCollectionAddon/index.js-editable-collection-addon-1234';

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

    it('shows an empty notes form when the leave a note button is clicked', () => {
      renderWithCollectionForSignedInUser({ editing: true });

      userEvent.click(screen.getByRole('button', { name: 'Leave a note' }));

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

    it('does not show <a> tag in DismissibleTextForm when editing notes', () => {
      const linkText = 'click here';
      const linkHref = 'https://addons.mozilla.org';
      const notes = `<a href="${linkHref}">${linkText}</a>`;
      renderWithNotes(notes);

      userEvent.click(screen.getByRole('button', { name: 'Edit' }));

      expect(
        screen.getByPlaceholderText('Add a comment about this add-on.'),
      ).toHaveValue(linkText);

      // The read-only portion should not be shown.
      expect(
        screen.queryByRole('heading', { name: `Collector's note` }),
      ).not.toBeInTheDocument();
    });

    it('hides the notes form when the cancel button is clicked', () => {
      renderWithNotes();

      userEvent.click(screen.getByRole('button', { name: 'Edit' }));

      expect(
        screen.getByPlaceholderText('Add a comment about this add-on.'),
      ).toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(
        screen.queryByPlaceholderText('Add a comment about this add-on.'),
      ).not.toBeInTheDocument();
    });

    it('dispatches deleteCollectionAddonNotes when clicking delete on DismissibleTextForm', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithNotes();

      userEvent.click(screen.getByRole('button', { name: 'Edit' }));
      userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(dispatch).toHaveBeenCalledWith(
        deleteCollectionAddonNotes({
          addonId: fakeAddon.id,
          errorHandlerId,
          filters: defaultFilters,
          lang,
          slug: defaultSlug,
          userId: defaultUserId,
        }),
      );
    });

    it('calls updateCollectionAddon when saving DismissibleTextForm', () => {
      const newNotes = 'Some new notes';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithNotes();

      userEvent.click(screen.getByRole('button', { name: 'Edit' }));

      userEvent.type(
        screen.getByPlaceholderText('Add a comment about this add-on.'),
        `{selectall}{del}${newNotes}`,
      );

      userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(dispatch).toHaveBeenCalledWith(
        updateCollectionAddon({
          addonId: fakeAddon.id,
          errorHandlerId,
          filters: defaultFilters,
          notes: createLocalizedString(newNotes, lang),
          slug: defaultSlug,
          userId: defaultUserId,
        }),
      );
    });

    describe('errorHandler - extractId', () => {
      it('returns a unique ID with an add-on', () => {
        expect(editableCollectionAddonExtractId({ addon: fakeAddon })).toEqual(
          `editable-collection-addon-${fakeAddon.id}`,
        );
      });
    });
  });

  describe('Tests for CollectionSort', () => {
    describe('onSortSelect', () => {
      it.each([true, false])(
        `calls history.push with expected pathname and query when a sort is selected and editing is %s`,
        (editing) => {
          const location = `${defaultLocation}${editing ? 'edit/' : ''}`;
          const sort = COLLECTION_SORT_NAME;
          const history = createHistory({
            initialEntries: [location],
          });
          const pushSpy = jest.spyOn(history, 'push');

          renderWithCollectionForSignedInUser({ history });

          userEvent.selectOptions(
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
  });
});
