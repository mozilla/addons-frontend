import { shallow } from 'enzyme';
import * as React from 'react';

import Collection, {
  CollectionBase,
  DEFAULT_ADDON_PLACEHOLDER_COUNT,
  extractId,
  mapStateToProps,
} from 'amo/pages/Collection';
import AddonsCard from 'amo/components/AddonsCard';
import CollectionAddAddon from 'amo/components/CollectionAddAddon';
import CollectionDetailsCard from 'amo/components/CollectionDetailsCard';
import CollectionControls from 'amo/components/CollectionControls';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import AuthenticateButton from 'core/components/AuthenticateButton';
import Paginate from 'core/components/Paginate';
import ConfirmButton from 'ui/components/ConfirmButton';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import {
  deleteCollection,
  deleteCollectionAddonNotes,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  getCurrentCollection,
  loadCurrentCollection,
  removeAddonFromCollection,
  updateCollectionAddon,
} from 'amo/reducers/collections';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'core/api';
import {
  CLIENT_APP_FIREFOX,
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  COLLECTION_SORT_NAME,
  INSTALL_SOURCE_COLLECTION,
  INSTALL_SOURCE_FEATURED_COLLECTION,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import {
  createFakeCollectionAddon,
  createFakeCollectionDetail,
  createFakeEvent,
  createFakeHistory,
  createInternalCollectionWithLang,
  createLocalizedString,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  createFakeLocation,
  shallowUntilTarget,
  createFakeCollectionAddonsListResponse,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultCollectionName = 'Collection name';
  const defaultCollectionDetail = createFakeCollectionDetail({
    name: defaultCollectionName,
  });
  const defaultUserId = defaultCollectionDetail.author.id;
  const defaultSlug = defaultCollectionDetail.slug;

  const getProps = ({ ...otherProps } = {}) => ({
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    location: createFakeLocation(),
    match: {
      params: {
        userId: String(defaultUserId),
        slug: defaultSlug,
      },
    },
    history: createFakeHistory(),
    store: dispatchClientMetadata().store,
    ...otherProps,
  });

  const renderComponent = ({ ...otherProps } = {}) => {
    const allProps = {
      ...getProps(),
      ...otherProps,
    };

    return shallowUntilTarget(<Collection {...allProps} />, CollectionBase);
  };

  const simulateReduxStateChange = ({ wrapper, store }) => {
    // This is needed because shallowUntilTarget() does not trigger any
    // lifecycle methods.
    wrapper.setProps(
      mapStateToProps(store.getState(), { location: createFakeLocation() }),
    );
  };

  const createCollectionWithTwoAddons = () => {
    const addons = [
      createFakeCollectionAddon({ addon: { ...fakeAddon, id: 1 } }),
      createFakeCollectionAddon({ addon: { ...fakeAddon, id: 2 } }),
    ];

    return {
      detail: createFakeCollectionDetail(),
      addonsResponse: createFakeCollectionAddonsListResponse({ addons }),
    };
  };

  const _loadCurrentCollection = ({
    addonsResponse = createFakeCollectionAddonsListResponse(),
    detail = defaultCollectionDetail,
    store,
  }) => {
    store.dispatch(
      loadCurrentCollection({
        addonsResponse,
        detail,
      }),
    );
  };

  it('renders itself', () => {
    const wrapper = renderComponent();

    expect(wrapper.find('.Collection')).toHaveLength(1);
    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
  });

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

  it('renders placeholder text if there are no add-ons', () => {
    const { store } = dispatchSignInActions();

    _loadCurrentCollection({
      store,
      addonsResponse: createFakeCollectionAddonsListResponse({ addons: [] }),
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(1);
    expect(wrapper.find('.Collection-placeholder').text()).toEqual(
      'Search for extensions and themes to add to your collection.',
    );
  });

  it('renders placeholder text when creating a collection', () => {
    const { store } = dispatchSignInActions();

    const wrapper = renderComponent({ creating: true, store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(1);
    expect(wrapper.find('.Collection-placeholder').text()).toEqual(
      'First, create your collection. Then you can add extensions and themes.',
    );
  });

  it('hides placeholder text when creating a collection if not logged in', () => {
    const { store } = dispatchClientMetadata();
    const wrapper = renderComponent({ creating: true, store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('hides placeholder text if there are add-ons', () => {
    const { store } = dispatchSignInActions();

    const addonsResponse = createFakeCollectionAddonsListResponse();
    const collectionDetail = createFakeCollectionDetail();

    _loadCurrentCollection({
      store,
      addonsResponse,
      detail: collectionDetail,
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('hides placeholder text when viewing a collection if the user is not logged in', () => {
    const { store } = dispatchClientMetadata();

    _loadCurrentCollection({
      store,
      addonsResponse: createFakeCollectionAddonsListResponse({ addons: [] }),
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('dispatches fetchCurrentCollection on mount', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const userId = 456;
    const params = { slug, userId: String(userId) };

    renderComponent({ errorHandler, match: { params }, store });

    // These are the expected default values for filters.
    const filters = {
      page: '1',
      collectionSort: COLLECTION_SORT_DATE_ADDED_DESCENDING,
    };

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters,
        slug,
        userId,
      }),
    );
  });

  // See: https://github.com/mozilla/addons-frontend/issues/7424
  it('dispatches fetchCurrentCollection on mount with a username in the URL', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const userId = 'this-is-not-a-user-id';
    const params = { slug, userId };

    renderComponent({ errorHandler, match: { params }, store });

    // These are the expected default values for filters.
    const filters = {
      page: '1',
      collectionSort: COLLECTION_SORT_DATE_ADDED_DESCENDING,
    };

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters,
        slug,
        userId,
      }),
    );
  });

  it('does not dispatch any fetches when switching to edit mode', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    _loadCurrentCollection({ store });

    fakeDispatch.resetHistory();

    renderComponent({ editing: true, errorHandler, store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any fetches when creating a collection', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    renderComponent({ creating: true, store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('passes filters from the query string to fetchCurrentCollection', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const userId = 567;
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    renderComponent({
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      match: { params: { slug, userId: String(userId) } },
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug,
        userId,
      }),
    );
  });

  it('does not dispatch any action when nothing has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    _loadCurrentCollection({ store });

    const wrapper = renderComponent({ store });
    fakeDispatch.resetHistory();

    // This will trigger the componentDidUpdate() method.
    wrapper.setProps();

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when location has not changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    _loadCurrentCollection({ store });

    const location = createFakeLocation();

    const wrapper = renderComponent({ location, store });
    fakeDispatch.resetHistory();

    // This will trigger the componentDidUpdate() method.
    wrapper.setProps({ location });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when loading collection', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const userId = 456;

    store.dispatch(
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        slug,
        userId,
      }),
    );

    fakeDispatch.resetHistory();
    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when loading collection page', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const userId = 456;

    store.dispatch(
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        slug,
        userId,
      }),
    );

    fakeDispatch.resetHistory();
    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when there is an error', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const wrapper = renderComponent({ dispatch: store.dispatch, store });

    const { errorHandler } = wrapper.instance().props;
    errorHandler.captureError(new Error('an unexpected error'));

    fakeDispatch.resetHistory();
    wrapper.setProps({ collection: null, errorHandler });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchCurrentCollection when location pathname has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    _loadCurrentCollection({ store });

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const userId = 456;
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    const location = createFakeLocation({
      pathname: `/collections/${userId}/${slug}/`,
      query: { page, collection_sort: sort },
    });

    const newSlug = 'other-collection';
    const newLocation = {
      ...location,
      pathname: `/collections/${userId}/${newSlug}/`,
    };

    const wrapper = renderComponent({
      errorHandler,
      location,
      match: { params: { slug, userId: String(userId) } },
      store,
    });
    fakeDispatch.resetHistory();

    // This will trigger the componentDidUpdate() method.
    wrapper.setProps({
      location: newLocation,
      match: { params: { slug: newSlug, userId: String(userId) } },
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug: newSlug,
        userId,
      }),
    );
  });

  it('dispatches fetchCurrentCollectionPage when page has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    _loadCurrentCollection({ store });

    const errorHandler = createStubErrorHandler();

    const wrapper = renderComponent({
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      store,
    });
    fakeDispatch.resetHistory();

    const newFilters = { collectionSort: sort, page: 999 };

    // This will trigger the componentDidUpdate() method.
    wrapper.setProps({ filters: newFilters });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        filters: newFilters,
        userId: defaultUserId,
        slug: defaultSlug,
      }),
    );
  });

  it('dispatches fetchCurrentCollectionPage when sort has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    _loadCurrentCollection({ store });

    const errorHandler = createStubErrorHandler();

    const wrapper = renderComponent({
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      store,
    });
    fakeDispatch.resetHistory();

    const newFilters = {
      page,
      collectionSort: COLLECTION_SORT_DATE_ADDED_DESCENDING,
    };

    // This will trigger the componentDidUpdate() method.
    wrapper.setProps({ filters: newFilters });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        filters: newFilters,
        userId: defaultUserId,
        slug: defaultSlug,
      }),
    );
  });

  it('dispatches fetchCurrentCollection when user param has changed', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    _loadCurrentCollection({ store });

    const wrapper = renderComponent({
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      store,
    });
    fakeDispatch.resetHistory();

    const newParams = {
      slug: defaultSlug,
      userId: '890',
    };
    wrapper.setProps({ match: { params: newParams } });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug: newParams.slug,
        userId: Number(newParams.userId),
      }),
    );
  });

  it('dispatches fetchCurrentCollection when slug param has changed', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    _loadCurrentCollection({ store });

    const wrapper = renderComponent({
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      store,
    });
    fakeDispatch.resetHistory();

    const newParams = {
      slug: 'some-other-collection-slug',
      userId: String(defaultUserId),
    };
    wrapper.setProps({ match: { params: newParams } });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug: newParams.slug,
        userId: Number(newParams.userId),
      }),
    );
  });

  it('renders a collection', () => {
    const slug = 'some-slug';
    const userId = 1234;
    const page = 2;
    const sort = COLLECTION_SORT_NAME;
    const queryParams = { page, collection_sort: sort };

    const { store } = dispatchClientMetadata();

    const detail = createFakeCollectionDetail({
      authorId: userId,
      count: 10,
      slug,
    });

    _loadCurrentCollection({ store, detail });

    const wrapper = renderComponent({
      location: createFakeLocation({ query: queryParams }),
      match: { params: { userId: String(userId), slug } },
      store,
    });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveProp('editing', false);
  });

  it('sets a default placeholder count', () => {
    const wrapper = renderComponent();
    expect(wrapper.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      DEFAULT_ADDON_PLACEHOLDER_COUNT,
    );
  });

  it('initializes add-on placeholder count with collection add-ons', () => {
    const { store } = dispatchClientMetadata();
    const { detail, addonsResponse } = createCollectionWithTwoAddons();

    _loadCurrentCollection({
      store,
      detail,
      addonsResponse,
    });

    const wrapper = renderComponent({
      params: { userId: detail.author.id, slug: detail.slug },
      store,
    });

    expect(wrapper.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      addonsResponse.results.length,
    );
  });

  it('updates add-on placeholder count with collection add-ons', () => {
    const { store } = dispatchClientMetadata();
    const { detail, addonsResponse } = createCollectionWithTwoAddons();

    const wrapper = renderComponent({
      params: { userId: detail.author.id, slug: detail.slug },
      store,
    });

    _loadCurrentCollection({
      store,
      detail,
      addonsResponse,
    });
    simulateReduxStateChange({ wrapper, store });

    // Since the placeholder calculation happens in
    // componentDidUpdate(), we need to re-render to see the effect.
    wrapper.setProps();

    expect(wrapper.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      addonsResponse.results.length,
    );
  });

  it('renders a collection with pagination', () => {
    const slug = 'some-slug';
    const userId = 123;
    const page = 2;
    const filters = { page, collection_sort: COLLECTION_SORT_NAME };

    const { store } = dispatchClientMetadata();

    const detail = createFakeCollectionDetail({
      authorId: userId,
      slug,
    });

    // With a pageSize < count, the pagination will be displayed.
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: 5,
    });
    _loadCurrentCollection({ store, addonsResponse, detail });

    const wrapper = renderComponent({
      location: createFakeLocation({ query: filters }),
      match: { params: { userId: String(userId), slug } },
      store,
    });

    const footer = wrapper.find(AddonsCard).prop('footer');
    const paginator = shallow(footer);

    expect(paginator.instance()).toBeInstanceOf(Paginate);
    expect(paginator).toHaveProp('count', addonsResponse.count);
    expect(paginator).toHaveProp('currentPage', page);
    expect(paginator).toHaveProp('pathname', `/collections/${userId}/${slug}/`);
    expect(paginator).toHaveProp('queryParams', filters);
    expect(wrapper.find('.Collection-edit-link')).toHaveLength(0);
  });

  it('declares an install source for non-featured collections', () => {
    const { store } = dispatchClientMetadata();

    _loadCurrentCollection({ store });

    const _isFeaturedCollection = sinon.spy(() => false);
    const wrapper = renderComponent({
      store,
      _isFeaturedCollection,
    });

    expect(wrapper.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      INSTALL_SOURCE_COLLECTION,
    );
    sinon.assert.called(_isFeaturedCollection);
  });

  it('declares an install source for featured collections', () => {
    const { store } = dispatchClientMetadata();

    _loadCurrentCollection({ store });

    const _isFeaturedCollection = sinon.spy(() => true);
    const wrapper = renderComponent({
      store,
      _isFeaturedCollection,
    });

    expect(wrapper.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      INSTALL_SOURCE_FEATURED_COLLECTION,
    );
    sinon.assert.called(_isFeaturedCollection);
  });

  it('renders a CollectionControls component', () => {
    const editing = false;
    const page = 2;
    const slug = 'some-slug';
    const sort = COLLECTION_SORT_NAME;
    const userId = 1234567;

    const { store } = dispatchClientMetadata();
    const addonsResponse = createFakeCollectionAddonsListResponse();
    const detail = createFakeCollectionDetail({
      authorId: userId,
      slug,
    });
    const collection = createInternalCollectionWithLang({
      detail,
      addonsResponse,
    });

    _loadCurrentCollection({
      store,
      addonsResponse,
      detail,
    });

    const wrapper = renderComponent({
      editing,
      location: createFakeLocation({ query: { collection_sort: sort, page } }),
      params: { userId: String(userId), slug },
      store,
    });

    const controls = wrapper.find(CollectionControls);

    expect(controls).toHaveProp('collection', collection);
    expect(controls).toHaveProp('editing', editing);
    expect(controls).toHaveProp('filters', {
      page,
      collectionSort: sort,
    });
  });

  it('renders a collection for editing', () => {
    const signedUserId = 11;
    const { store } = dispatchSignInActions({ userId: signedUserId });

    const slug = 'some-slug';
    const userId = signedUserId + 123;
    const page = 2;
    const sort = COLLECTION_SORT_NAME;

    // With a pageSize < count, the pagination will be displayed.
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: 10,
      pageSize: 5,
    });
    const detail = createFakeCollectionDetail({
      authorId: userId,
      slug,
    });

    _loadCurrentCollection({
      store,
      addonsResponse,
      detail,
    });

    const wrapper = renderComponent({
      editing: true,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      match: { params: { userId: String(userId), slug } },
      store,
    });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveProp('editing', true);

    const footer = wrapper.find(AddonsCard).prop('footer');
    const paginator = shallow(footer);
    expect(paginator).toHaveProp(
      'pathname',
      `/collections/${userId}/${slug}/edit/`,
    );

    expect(wrapper.find(AddonsCard)).toHaveProp(
      'deleteNote',
      wrapper.instance().deleteNote,
    );
    expect(wrapper.find(AddonsCard)).toHaveProp(
      'removeAddon',
      wrapper.instance().removeAddon,
    );
    expect(wrapper.find(AddonsCard)).toHaveProp(
      'saveNote',
      wrapper.instance().saveNote,
    );
  });

  it('renders a create collection page', () => {
    const { store } = dispatchSignInActions();

    const wrapper = renderComponent({ creating: true, store });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveLength(0);
    expect(wrapper.find(CollectionDetailsCard)).toHaveProp('creating', true);
    expect(wrapper.find(CollectionControls)).toHaveLength(0);
  });

  it('does not render the pagination when no add-ons in the collection', () => {
    const { store } = dispatchClientMetadata();

    const addonsResponse = createFakeCollectionAddonsListResponse({
      addons: [],
    });
    const collectionDetail = createFakeCollectionDetail();

    _loadCurrentCollection({
      store,
      addonsResponse,
      detail: collectionDetail,
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(AddonsCard).prop('footer')).toEqual(null);
  });

  it('renders loading indicator on add-ons when fetching next page', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = createStubErrorHandler();
    const { slug } = defaultCollectionDetail;
    const userId = defaultUserId;

    // User loads the collection page.
    _loadCurrentCollection({ store });

    const wrapper = renderComponent({
      errorHandler,
      match: { params: { slug, userId: String(userId) } },
      store,
    });

    expect(wrapper.find(AddonsCard)).toHaveProp('loading', false);

    // User clicks on 'next' pagination link.
    store.dispatch(
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        filters: { page: 2 },
        slug,
        userId,
      }),
    );

    simulateReduxStateChange({ wrapper, store });

    expect(wrapper.find(AddonsCard)).toHaveProp('loading', true);
    // We should not update the collection detail card.
    expect(wrapper.find('.Collection-detail').find(LoadingText)).toHaveLength(
      0,
    );
  });

  it('renders 404 page for missing collection', () => {
    const { store } = dispatchClientMetadata();

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

    const wrapper = renderComponent({ errorHandler, store });
    expect(wrapper.find(NotFoundPage)).toHaveLength(1);
  });

  it('renders an error if one exists', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status: 500 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Nope.' },
      }),
    );

    const wrapper = renderComponent({ errorHandler, store });
    expect(wrapper.find(ErrorList)).toHaveLength(1);
  });

  it('renders an HTML title', () => {
    const { store } = dispatchClientMetadata();

    _loadCurrentCollection({ store });

    const wrapper = renderComponent({ store });
    expect(wrapper.find('title')).toHaveText(defaultCollectionName);
  });

  it('does not render an HTML title when there is no collection loaded', () => {
    const wrapper = renderComponent();
    expect(wrapper.find('title')).toHaveLength(0);
  });

  it('renders a delete button when user is the collection owner', () => {
    const authorId = 11;
    const { store } = dispatchSignInActions({ userId: authorId });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId,
      }),
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(ConfirmButton)).toHaveLength(1);
  });

  it('does not render a delete button when user is not the collection owner', () => {
    const authorId = 11;
    const { store } = dispatchSignInActions({ userId: authorId });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId: 99,
      }),
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(ConfirmButton)).toHaveLength(0);
  });

  it('passes the correct editing flag to AddonsCard when editing', () => {
    const authorId = 11;
    const { store } = dispatchSignInActions({ userId: authorId });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId,
      }),
    });

    const root = renderComponent({ store, editing: true });

    expect(root.find(AddonsCard)).toHaveProp('editing', true);
  });

  it('renders a CollectionAddAddon component when editing', () => {
    const authorId = 11;
    const page = 2;
    const sort = COLLECTION_SORT_NAME;
    const queryParams = { page, collection_sort: sort };
    const filters = { collectionSort: sort, page };
    const { store } = dispatchSignInActions({ userId: authorId });

    const addonsResponse = createFakeCollectionAddonsListResponse();
    const detail = createFakeCollectionDetail({ authorId });
    const collection = createInternalCollectionWithLang({
      detail,
      addonsResponse,
    });

    _loadCurrentCollection({ addonsResponse, detail, store });

    const root = renderComponent({
      store,
      editing: true,
      location: createFakeLocation({ query: queryParams }),
    });

    expect(root.find(CollectionAddAddon)).toHaveProp('collection', collection);
    expect(root.find(CollectionAddAddon)).toHaveProp('filters', filters);
  });

  it('does not render a CollectionAddAddon component when not editing', () => {
    const root = renderComponent({ editing: false });

    expect(root.find(CollectionAddAddon)).toHaveLength(0);
  });

  it('renders AuthenticateButton when creating and not signed in', () => {
    const { store } = dispatchClientMetadata();
    const location = createFakeLocation({
      pathname: '/create/url/',
    });
    const root = renderComponent({ store, creating: true, location });

    const authButton = root.find(AuthenticateButton);
    expect(authButton).toHaveProp('logInText', 'Log in to create a collection');

    // Make sure the collection was not rendered.
    expect(root.find('.Collection-wrapper')).toHaveLength(0);
  });

  it('renders AuthenticateButton when editing and not signed in', () => {
    const { store } = dispatchClientMetadata();
    const location = createFakeLocation({
      pathname: '/current/edit/url/',
    });
    const root = renderComponent({ store, editing: true, location });

    const authButton = root.find(AuthenticateButton);
    expect(authButton).toHaveProp(
      'logInText',
      'Log in to edit this collection',
    );

    // Make sure the collection was not rendered.
    expect(root.find('.Collection-wrapper')).toHaveLength(0);
  });

  it('does not update the page when removeAddon is called and there are still addons to show on the current page', () => {
    const authorId = 11;
    const { store } = dispatchSignInActions({ userId: authorId });

    // This will simulate a few items on the 2nd page.
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: DEFAULT_API_PAGE_SIZE + 2,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const detail = createFakeCollectionDetail({ authorId });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = '2';
    const sort = COLLECTION_SORT_NAME;
    const location = createFakeLocation({
      query: { page, collection_sort: sort },
    });
    const history = createFakeHistory({ location });

    store.dispatch(
      loadCurrentCollection({
        addonsResponse,
        detail,
      }),
    );

    const root = renderComponent({
      editing: true,
      errorHandler,
      history,
      location,
      store,
    });

    fakeDispatch.resetHistory();

    // This simulates the user clicking the "Remove" button on the
    // EditableCollectionAddon component.
    root.instance().removeAddon(addonId);
    sinon.assert.calledWith(
      fakeDispatch,
      removeAddonFromCollection({
        addonId,
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug: detail.slug,
        userId: detail.author.id,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);

    sinon.assert.notCalled(history.push);
  });

  it("does not update the page when removeAddon is called and the current page isn't the last page", () => {
    const authorId = 11;
    const { store } = dispatchSignInActions({ userId: authorId });

    // This will simulate 1 item on the 3nd page.
    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: DEFAULT_API_PAGE_SIZE * 2 + 1,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const detail = createFakeCollectionDetail({ authorId });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = '1';
    const sort = COLLECTION_SORT_NAME;
    const location = createFakeLocation({
      query: { page, collection_sort: sort },
    });
    const history = createFakeHistory({ location });

    store.dispatch(
      loadCurrentCollection({
        addonsResponse,
        detail,
      }),
    );

    const root = renderComponent({
      editing: true,
      errorHandler,
      history,
      location,
      store,
    });

    fakeDispatch.resetHistory();

    // This simulates the user clicking the "Remove" button on the
    // EditableCollectionAddon component.
    root.instance().removeAddon(addonId);
    sinon.assert.calledWith(
      fakeDispatch,
      removeAddonFromCollection({
        addonId,
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug: detail.slug,
        userId: detail.author.id,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);

    sinon.assert.notCalled(history.push);
  });

  it('updates the page when removeAddon removes the last addon from the current page', () => {
    const authorId = 11;
    const { store } = dispatchSignInActions({ userId: authorId });

    const addonsResponse = createFakeCollectionAddonsListResponse({
      count: DEFAULT_API_PAGE_SIZE + 1,
    });
    const addonId = addonsResponse.results[0].addon.id;
    const detail = createFakeCollectionDetail({ authorId });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = '2';
    const newPage = '1';
    const sort = COLLECTION_SORT_DATE_ADDED_DESCENDING;
    const location = createFakeLocation({
      query: { page, collectionSort: sort },
    });
    const history = createFakeHistory({ location });

    store.dispatch(
      loadCurrentCollection({
        addonsResponse,
        detail,
      }),
    );

    const root = renderComponent({
      editing: true,
      errorHandler,
      history,
      location,
      store,
    });

    fakeDispatch.resetHistory();

    // This simulates the user clicking the "Remove" button on the
    // EditableCollectionAddon component.
    root.instance().removeAddon(addonId);
    sinon.assert.calledWith(
      fakeDispatch,
      removeAddonFromCollection({
        addonId,
        errorHandlerId: errorHandler.id,
        filters: { page: newPage, collectionSort: sort },
        slug: detail.slug,
        userId: detail.author.id,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);

    sinon.assert.calledWith(history.push, {
      pathname: location.pathname,
      query: {
        ...location.query,
        page: newPage,
      },
    });
  });

  it('dispatches deleteCollection when onDelete is called', () => {
    const authorId = 11;
    const slug = 'some-slug';
    const { store } = dispatchSignInActions({ userId: authorId });

    const detail = createFakeCollectionDetail({ authorId, slug });

    store.dispatch(
      loadCurrentCollection({
        addonsResponse: createFakeCollectionAddonsListResponse(),
        detail,
      }),
    );

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const preventDefaultSpy = sinon.spy();
    const errorHandler = createStubErrorHandler();

    const wrapper = renderComponent({ errorHandler, store });

    dispatchSpy.resetHistory();

    // This emulates a user clicking the delete button and confirming.
    const onDelete = wrapper.find(ConfirmButton).prop('onConfirm');
    onDelete(createFakeEvent({ preventDefault: preventDefaultSpy }));

    sinon.assert.calledOnce(preventDefaultSpy);
    sinon.assert.callCount(dispatchSpy, 1);
    sinon.assert.calledWith(
      dispatchSpy,
      deleteCollection({
        errorHandlerId: errorHandler.id,
        slug,
        userId: detail.author.id,
      }),
    );
  });

  it('dispatches deleteCollectionAddonNotes when deleteNote is called', () => {
    const authorId = 11;
    const lang = 'fr';
    const { store } = dispatchSignInActions({ lang, userId: authorId });

    const addonsResponse = createFakeCollectionAddonsListResponse();
    const addonId = addonsResponse.results[0].addon.id;
    const detail = createFakeCollectionDetail({ authorId });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    store.dispatch(
      loadCurrentCollection({
        addonsResponse,
        detail,
      }),
    );
    const root = renderComponent({
      editing: true,
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      store,
    });

    fakeDispatch.resetHistory();

    // This simulates the user clicking the "Delete" button on the
    // EditableCollectionAddon component's comment form.
    const deleteNote = root.find(AddonsCard).prop('deleteNote');
    deleteNote(addonId, errorHandler);
    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      deleteCollectionAddonNotes({
        addonId,
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        lang,
        slug: detail.slug,
        userId: detail.author.id,
      }),
    );
  });

  it('dispatches updateCollectionAddon when saveNote is called', () => {
    const authorId = 11;
    const lang = 'fr';
    const { store } = dispatchSignInActions({ lang, userId: authorId });

    const addonsResponse = createFakeCollectionAddonsListResponse();
    const addonId = addonsResponse.results[0].addon.id;
    const detail = createFakeCollectionDetail({ authorId });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const notes = 'These are some notes.';
    const sort = COLLECTION_SORT_NAME;

    store.dispatch(
      loadCurrentCollection({
        addonsResponse,
        detail,
      }),
    );
    const root = renderComponent({
      editing: true,
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      store,
    });

    fakeDispatch.resetHistory();

    // This simulates the user clicking the "Save" button on the
    // EditableCollectionAddon component's comment form.
    root.instance().saveNote(addonId, errorHandler, notes);
    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      updateCollectionAddon({
        addonId,
        errorHandlerId: errorHandler.id,
        notes: createLocalizedString(notes, lang),
        filters: { page, collectionSort: sort },
        slug: detail.slug,
        userId: detail.author.id,
      }),
    );
  });

  it('sends a server redirect when userId parameter is not a numeric ID', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr';
    const authorId = 123;
    const authorUsername = 'john';

    const { store } = dispatchClientMetadata({ clientApp, lang });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const addonsResponse = createFakeCollectionAddonsListResponse();
    const collectionDetail = createFakeCollectionDetail({
      authorId,
      authorUsername,
    });

    _loadCurrentCollection({
      store,
      addonsResponse,
      detail: collectionDetail,
    });

    fakeDispatch.resetHistory();

    const collection = getCurrentCollection(store.getState().collections);

    const params = {
      slug: collection.slug,
      // We use the `username` here.
      userId: authorUsername.toUpperCase(),
    };
    renderComponent({ match: { params }, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/collections/${collection.authorId}/${collection.slug}/`,
      }),
    );
    sinon.assert.calledOnce(fakeDispatch);
  });

  it('sends a server redirect when slug parameter case is not the same as the collection slug', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr';
    const slug = 'some-slug-collection';

    const { store } = dispatchClientMetadata({ clientApp, lang });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const addonsResponse = createFakeCollectionAddonsListResponse();
    const collectionDetail = createFakeCollectionDetail({ slug });

    _loadCurrentCollection({
      store,
      addonsResponse,
      detail: collectionDetail,
    });

    fakeDispatch.resetHistory();

    const collection = getCurrentCollection(store.getState().collections);

    const params = {
      slug: slug.toUpperCase(),
      // We use the `username` here.
      userId: collection.authorUsername,
    };
    renderComponent({ match: { params }, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/collections/${collection.authorId}/${collection.slug}/`,
      }),
    );
    sinon.assert.calledOnce(fakeDispatch);
  });

  it('renders a "description" meta tag', () => {
    const name = 'my super collection';
    const description = 'this is the description of my super collection';

    const { store } = dispatchClientMetadata();
    const detail = createFakeCollectionDetail({ description, name });
    _loadCurrentCollection({ detail, store });

    const root = renderComponent({ store });

    expect(root.find('meta[name="description"]')).toHaveLength(1);
    expect(root.find('meta[name="description"]').prop('content')).toMatch(
      new RegExp(`Explore the ${name}—${description}.`),
    );
  });

  it('renders a "description" meta tag without a collection description', () => {
    const name = 'my super collection';
    const description = '';

    const { store } = dispatchClientMetadata();
    const detail = createFakeCollectionDetail({ description, name });
    _loadCurrentCollection({ detail, store });

    const root = renderComponent({ store });

    expect(root.find('meta[name="description"]')).toHaveLength(1);
    expect(root.find('meta[name="description"]').prop('content')).toMatch(
      new RegExp(`Explore the ${name}.`),
    );
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const props = getProps({
        match: {
          params: {
            userId: '123',
            slug: 'collection-bar',
          },
        },
        location: createFakeLocation(),
      });

      expect(extractId(props)).toEqual('123/collection-bar/');
    });

    it('adds the page as part of unique ID', () => {
      const props = getProps({
        match: {
          params: {
            userId: '123',
            slug: 'collection-bar',
          },
        },
        location: createFakeLocation({ query: { page: '124' } }),
      });

      expect(extractId(props)).toEqual('123/collection-bar/124');
    });
  });
});
