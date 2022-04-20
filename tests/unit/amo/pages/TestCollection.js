import config from 'config';
import { createEvent, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createApiError } from 'amo/api';
import {
  extractId as collectionAddAddonExtractId,
  MESSAGE_RESET_TIME,
} from 'amo/components/CollectionAddAddon';
import { extractId as editableCollectionAddonExtractId } from 'amo/components/EditableCollectionAddon';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  COLLECTION_SORT_NAME,
} from 'amo/constants';
import {
  FETCH_CURRENT_COLLECTION,
  FETCH_CURRENT_COLLECTION_PAGE,
  addAddonToCollection,
  addonAddedToCollection,
  addonRemovedFromCollection,
  collectionName,
  deleteCollection,
  deleteCollectionAddonNotes,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  loadCurrentCollection,
  removeAddonFromCollection,
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
  const editableCollectionAddonErrorHandlerId =
    'src/amo/components/EditableCollectionAddon/index.js-editable-collection-addon-1234';
  const lang = 'en-US';

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

  const clickEditButton = () =>
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

  it('does not update the page when removeAddon is called and there are still addons to show on the current page', () => {
    const numberOfAddons = 5;
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: numberOfAddons,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const page = '2';
    const history = createHistory({
      initialEntries: [`${getLocation({ editing: true })}?page=${page}`],
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
      initialEntries: [`${getLocation({ editing: true })}?page=${page}`],
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
        `${getLocation({
          editing: true,
        })}?page=${page}&collection_sort=${sort}`,
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
      pathname: getLocation({ editing: true }),
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

  it('dispatches deleteCollectionAddonNotes when clicking delete on DismissibleTextForm', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderWithNotes();

    userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    userEvent.click(screen.getByRole('button', { name: 'Delete' }));

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

  it('dispatches updateCollectionAddon when saving DismissibleTextForm', () => {
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
        errorHandlerId: editableCollectionAddonErrorHandlerId,
        filters: defaultFilters,
        notes: createLocalizedString(newNotes, lang),
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

  describe('Tests for CollectionAddAddon', () => {
    const getErrorHandlerId = (id = '') =>
      `src/amo/components/CollectionAddAddon/index.js-collection${id}`;

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

  describe('Tests for CollectionSort', () => {
    it.each([true, false])(
      `calls history.push with expected pathname and query when a sort is selected and editing is %s`,
      (editing) => {
        const location = getLocation({ editing });
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

    describe('errorHandler - extractId', () => {
      it('returns a unique ID with an add-on', () => {
        expect(editableCollectionAddonExtractId({ addon: fakeAddon })).toEqual(
          `editable-collection-addon-${fakeAddon.id}`,
        );
      });
    });
  });
});
