import { shallow } from 'enzyme';
import * as React from 'react';

import Collection, {
  CollectionBase,
  DEFAULT_ADDON_PLACEHOLDER_COUNT,
  extractId,
  mapStateToProps,
} from 'amo/components/Collection';
import AddonsCard from 'amo/components/AddonsCard';
import CollectionAddAddon from 'amo/components/CollectionAddAddon';
import CollectionDetails from 'amo/components/CollectionDetails';
import CollectionManager from 'amo/components/CollectionManager';
import CollectionControls from 'amo/components/CollectionControls';
import NotFound from 'amo/components/ErrorPage/NotFound';
import AuthenticateButton from 'core/components/AuthenticateButton';
import Paginate from 'core/components/Paginate';
import ConfirmButton from 'ui/components/ConfirmButton';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import {
  createInternalCollection,
  deleteCollection,
  deleteCollectionAddonNotes,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  loadCurrentCollection,
  removeAddonFromCollection,
  updateCollectionAddon,
} from 'amo/reducers/collections';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'core/api';
import {
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  COLLECTION_SORT_NAME,
  FEATURED_THEMES_COLLECTION_EDIT,
  FEATURED_THEMES_COLLECTION_SLUG,
  INSTALL_SOURCE_COLLECTION,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  MOZILLA_COLLECTIONS_EDIT,
  MOZILLA_COLLECTIONS_USERNAME,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import {
  createFakeEvent,
  createFakeHistory,
  createStubErrorHandler,
  fakeI18n,
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createFakeCollectionAddon,
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const defaultCollectionDetail = createFakeCollectionDetail();
  const defaultUser = defaultCollectionDetail.author.username;
  const defaultSlug = defaultCollectionDetail.slug;

  const getProps = ({ ...otherProps } = {}) => ({
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    location: createFakeLocation(),
    match: {
      params: {
        username: defaultUser,
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
      addons: createFakeCollectionAddons({ addons }),
    };
  };

  const _loadCurrentCollection = ({
    store,
    addons = createFakeCollectionAddons(),
    detail = defaultCollectionDetail,
    pageSize = DEFAULT_API_PAGE_SIZE,
  }) => {
    store.dispatch(
      loadCurrentCollection({
        addons,
        detail,
        pageSize,
      }),
    );
  };

  it('renders itself', () => {
    const wrapper = renderComponent();

    expect(wrapper.find('.Collection')).toHaveLength(1);
    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
  });

  it('renders a CollectionDetail when not editing', () => {
    const wrapper = renderComponent({ creating: false, editing: false });

    expect(wrapper.find(CollectionDetails)).toHaveLength(1);
  });

  it('renders placeholder text if there are no add-ons', () => {
    const { store } = dispatchSignInActions();

    _loadCurrentCollection({ store, addons: [] });

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

    const collectionAddons = createFakeCollectionAddons();
    const collectionDetail = createFakeCollectionDetail();

    _loadCurrentCollection({
      store,
      addons: collectionAddons,
      detail: collectionDetail,
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('hides placeholder text when viewing a collection if the user is not logged in', () => {
    const { store } = dispatchClientMetadata();

    _loadCurrentCollection({ store, addons: [] });

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('dispatches fetchCurrentCollection on mount', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const username = 'some-user';
    const params = { slug, username };

    renderComponent({ errorHandler, match: { params }, store });

    // These are the expected default values for filters.
    const filters = {
      page: 1,
      collectionSort: COLLECTION_SORT_DATE_ADDED_DESCENDING,
    };

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters,
        slug,
        username,
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
    const username = 'some-user';
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    renderComponent({
      errorHandler,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      match: { params: { slug, username } },
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug,
        username,
      }),
    );
  });

  it('does not dispatch any action when nothing has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    _loadCurrentCollection({ store });

    const wrapper = renderComponent({ store });
    fakeDispatch.resetHistory();

    // This will trigger the componentWillReceiveProps() method.
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

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({ location });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when loading collection', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const username = 'some-user';

    store.dispatch(
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        slug,
        username,
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
    const username = 'some-user';

    store.dispatch(
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        slug,
        username,
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
    const username = 'some-user';
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    const location = createFakeLocation({
      pathname: `/collections/${username}/${slug}/`,
      query: { page, collection_sort: sort },
    });

    const newSlug = 'other-collection';
    const newLocation = {
      ...location,
      pathname: `/collections/${username}/${newSlug}/`,
    };

    const wrapper = renderComponent({
      errorHandler,
      location,
      match: { params: { slug, username } },
      store,
    });
    fakeDispatch.resetHistory();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({
      location: newLocation,
      match: { params: { slug: newSlug, username } },
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        slug: newSlug,
        username,
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

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({ filters: newFilters });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        filters: newFilters,
        username: defaultUser,
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

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({ filters: newFilters });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        filters: newFilters,
        username: defaultUser,
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
      username: 'another-user',
    };
    wrapper.setProps({ match: { params: newParams } });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        ...newParams,
      }),
    );
  });

  it('compares username values in lower case', () => {
    const username = 'Mozilla';
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({ authorUsername: username }),
    });

    const fakeDispatch = sinon.spy(store, 'dispatch');

    const wrapper = renderComponent({ errorHandler, store });
    fakeDispatch.resetHistory();

    wrapper.setProps({
      match: {
        params: { slug: defaultSlug, username: username.toLowerCase() },
      },
    });

    sinon.assert.notCalled(fakeDispatch);
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
      username: defaultUser,
    };
    wrapper.setProps({ match: { params: newParams } });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        filters: { page, collectionSort: sort },
        ...newParams,
      }),
    );
  });

  it('renders a collection', () => {
    const slug = 'some-slug';
    const username = 'some-username';
    const page = 2;
    const sort = COLLECTION_SORT_NAME;
    const queryParams = { page, collection_sort: sort };

    const { store } = dispatchClientMetadata();

    const detail = createFakeCollectionDetail({
      authorUsername: username,
      count: 10,
      slug,
    });

    _loadCurrentCollection({ store, detail });

    const wrapper = renderComponent({
      location: createFakeLocation({ query: queryParams }),
      match: { params: { username, slug } },
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
    const { detail, addons } = createCollectionWithTwoAddons();

    _loadCurrentCollection({
      store,
      detail,
      addons,
    });

    const wrapper = renderComponent({
      params: { username: detail.author.username, slug: detail.slug },
      store,
    });

    expect(wrapper.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      addons.length,
    );
  });

  it('updates add-on placeholder count with collection add-ons', () => {
    const { store } = dispatchClientMetadata();
    const { detail, addons } = createCollectionWithTwoAddons();

    const wrapper = renderComponent({
      params: { username: detail.author.username, slug: detail.slug },
      store,
    });

    _loadCurrentCollection({
      store,
      detail,
      addons,
    });
    simulateReduxStateChange({ wrapper, store });

    // Since the placeholder calculation happens in
    // componentDidUpdate(), we need to re-render to see the effect.
    wrapper.setProps();

    expect(wrapper.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      addons.length,
    );
  });

  it('renders collection details', () => {
    const slug = 'some-slug';
    const username = 'some-username';
    const page = 2;
    const sort = COLLECTION_SORT_NAME;
    const queryParams = { page, collection_sort: sort };
    const pageSize = DEFAULT_API_PAGE_SIZE;

    const { store } = dispatchClientMetadata();

    const addons = createFakeCollectionAddons();
    const detail = createFakeCollectionDetail({
      authorUsername: username,
      count: 10,
      slug,
    });
    const collection = createInternalCollection({
      detail,
      items: addons,
      pageSize,
    });

    _loadCurrentCollection({ addons, detail, pageSize, store });

    const wrapper = renderComponent({
      location: createFakeLocation({ query: queryParams }),
      params: { username, slug },
      store,
    });

    const details = wrapper.find(CollectionDetails);
    expect(details).toHaveLength(1);
    expect(details).toHaveProp('collection', collection);
    expect(details).toHaveProp('filters', { page, collectionSort: sort });
    expect(details).toHaveProp('showEditButton', false);
  });

  it('renders a collection with pagination', () => {
    const slug = 'some-slug';
    const username = 'some-username';
    const page = 2;
    const filters = { page, collection_sort: COLLECTION_SORT_NAME };

    const { store } = dispatchClientMetadata();

    const detail = createFakeCollectionDetail({
      authorUsername: username,
      count: 10,
      slug,
    });

    // With a pageSize < count, the pagination will be displayed.
    _loadCurrentCollection({ store, detail, pageSize: 5 });

    const wrapper = renderComponent({
      location: createFakeLocation({ query: filters }),
      match: { params: { username, slug } },
      store,
    });

    const footer = wrapper.find(AddonsCard).prop('footer');
    const paginator = shallow(footer);

    expect(paginator.instance()).toBeInstanceOf(Paginate);
    expect(paginator).toHaveProp('count', detail.addon_count);
    expect(paginator).toHaveProp('currentPage', page);
    expect(paginator).toHaveProp(
      'pathname',
      `/collections/${username}/${slug}/`,
    );
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
    const pageSize = 10;
    const slug = 'some-slug';
    const sort = COLLECTION_SORT_NAME;
    const username = 'some-username';

    const { store } = dispatchClientMetadata();
    const addons = createFakeCollectionAddons();
    const detail = createFakeCollectionDetail({
      authorUsername: username,
      slug,
    });
    const collection = createInternalCollection({
      detail,
      items: addons,
      pageSize,
    });

    _loadCurrentCollection({
      store,
      addons,
      detail,
      pageSize,
    });

    const wrapper = renderComponent({
      editing,
      location: createFakeLocation({ query: { collection_sort: sort, page } }),
      params: { username, slug },
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
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const slug = 'some-slug';
    const username = 'some-username';
    const page = 2;
    const sort = COLLECTION_SORT_NAME;

    const addons = createFakeCollectionAddons();
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
      authorUsername: username,
      count: 10,
      slug,
    });

    // With a pageSize < count, the pagination will be displayed.
    const pageSize = 5;

    _loadCurrentCollection({
      store,
      addons,
      detail,
      pageSize,
    });

    const wrapper = renderComponent({
      editing: true,
      location: createFakeLocation({ query: { page, collection_sort: sort } }),
      match: { params: { username, slug } },
      store,
    });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveProp('editing', true);

    const footer = wrapper.find(AddonsCard).prop('footer');
    const paginator = shallow(footer);
    expect(paginator).toHaveProp(
      'pathname',
      `/collections/${username}/${slug}/edit/`,
    );

    expect(wrapper.find(CollectionManager)).toHaveLength(1);
    expect(wrapper.find(CollectionManager)).toHaveProp(
      'collection',
      createInternalCollection({
        items: addons,
        detail,
        pageSize,
      }),
    );
    expect(wrapper.find(CollectionManager)).toHaveProp('creating', false);
    expect(wrapper.find(CollectionManager)).toHaveProp('filters', {
      page,
      collectionSort: sort,
    });
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

    // Make sure details are not rendered.
    expect(wrapper.find(CollectionDetails)).toHaveLength(0);
  });

  it('renders a create collection page', () => {
    const { store } = dispatchSignInActions();

    const wrapper = renderComponent({ creating: true, store });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveLength(0);
    expect(wrapper.find(CollectionManager)).toHaveLength(1);
    expect(wrapper.find(CollectionManager)).toHaveProp('creating', true);
    expect(wrapper.find(CollectionManager)).toHaveProp('collection', null);

    // Make sure details are not rendered.
    expect(wrapper.find(CollectionDetails)).toHaveLength(0);
  });

  it('does not render the pagination when no add-ons in the collection', () => {
    const { store } = dispatchClientMetadata();

    const collectionAddons = createFakeCollectionAddons({ addons: [] });
    const collectionDetail = createFakeCollectionDetail({ count: 0 });

    _loadCurrentCollection({
      store,
      addons: collectionAddons,
      detail: collectionDetail,
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(AddonsCard).prop('footer')).toEqual(null);
  });

  it('renders loading indicator on add-ons when fetching next page', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = createStubErrorHandler();
    const { slug } = defaultCollectionDetail;
    const username = defaultUser;

    // User loads the collection page.
    _loadCurrentCollection({ store });

    const wrapper = renderComponent({
      errorHandler,
      match: { params: { slug, username } },
      store,
    });

    expect(wrapper.find(AddonsCard)).toHaveProp('loading', false);

    // User clicks on 'next' pagination link.
    store.dispatch(
      fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        filters: { page: 2 },
        slug,
        username,
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
    expect(wrapper.find(NotFound)).toHaveLength(1);
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
    expect(wrapper.find('title')).toHaveText(defaultCollectionDetail.name);
  });

  it('does not render an HTML title when there is no collection loaded', () => {
    const wrapper = renderComponent();
    expect(wrapper.find('title')).toHaveLength(0);
  });

  it('renders an edit link for a mozilla collection when user has the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [MOZILLA_COLLECTIONS_EDIT],
      },
    });

    const slug = 'some-slug';
    const username = MOZILLA_COLLECTIONS_USERNAME;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('renders a CollectionManager in edit mode for a mozilla collection when user has the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [MOZILLA_COLLECTIONS_EDIT],
      },
    });

    const slug = 'some-slug';
    const username = MOZILLA_COLLECTIONS_USERNAME;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ store, editing: true });

    expect(wrapper.find(CollectionManager)).toHaveLength(1);
  });

  it('does not render an edit link for a mozilla collection when user does not have the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions();

    const slug = 'some-slug';
    const username = MOZILLA_COLLECTIONS_USERNAME;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('renders an edit link for the Featured Themes collection when user has the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const slug = FEATURED_THEMES_COLLECTION_SLUG;
    const username = MOZILLA_COLLECTIONS_USERNAME;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('does not render a CollectionManager in edit mode for the Featured Themes collection when user has only the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const slug = FEATURED_THEMES_COLLECTION_SLUG;
    const username = MOZILLA_COLLECTIONS_USERNAME;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ store, editing: true });

    expect(wrapper.find(CollectionManager)).toHaveLength(0);
  });

  it('passes the editing property to CollectionDetails in edit mode for the Featured Themes collection when user has only the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const slug = FEATURED_THEMES_COLLECTION_SLUG;
    const username = MOZILLA_COLLECTIONS_USERNAME;
    const editing = true;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ store, editing });

    expect(wrapper.find(CollectionDetails)).toHaveProp('editing', editing);
  });

  it('does not render an edit link in edit mode for the Featured Themes collection when user has only the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const slug = FEATURED_THEMES_COLLECTION_SLUG;
    const username = MOZILLA_COLLECTIONS_USERNAME;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ editing: true, store });

    expect(wrapper.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('does not render an edit link for a the Featured Themes collection when user does not have the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions();

    const slug = FEATURED_THEMES_COLLECTION_SLUG;
    const username = MOZILLA_COLLECTIONS_USERNAME;

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });

    const wrapper = renderComponent({ store });

    expect(wrapper.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('renders an edit link when user is the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId: authorUserId,
      }),
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('does not render an edit link when user is not the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: 99 });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId: authorUserId,
      }),
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('renders a delete button when user is the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId: authorUserId,
      }),
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(ConfirmButton)).toHaveLength(1);
  });

  it('does not render a delete button when user is not the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId: 99,
      }),
    });

    const wrapper = renderComponent({ store });
    expect(wrapper.find(ConfirmButton)).toHaveLength(0);
  });

  it('passes a collection to CollectionManager when editing', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
    });

    _loadCurrentCollection({ store, detail });

    const root = renderComponent({ store, editing: true });

    const manager = root.find(CollectionManager);
    expect(manager).toHaveProp('collection');
    expect(manager.prop('collection').id).toEqual(detail.id);
  });

  it('passes the correct editing flag to AddonsCard when editing', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    _loadCurrentCollection({
      store,
      detail: createFakeCollectionDetail({
        authorId: authorUserId,
      }),
    });

    const root = renderComponent({ store, editing: true });

    expect(root.find(AddonsCard)).toHaveProp('editing', true);
  });

  it('renders a CollectionAddAddon component when editing', () => {
    const authorUserId = 11;
    const page = 2;
    const sort = COLLECTION_SORT_NAME;
    const queryParams = { page, collection_sort: sort };
    const pageSize = DEFAULT_API_PAGE_SIZE;
    const filters = { collectionSort: sort, page };
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const addons = createFakeCollectionAddons();
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
    });
    const collection = createInternalCollection({
      detail,
      items: addons,
      pageSize,
    });

    _loadCurrentCollection({ addons, detail, pageSize, store });

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
    expect(authButton).toHaveProp('location', location);
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
    expect(authButton).toHaveProp('location', location);
    expect(authButton).toHaveProp(
      'logInText',
      'Log in to edit this collection',
    );

    // Make sure the collection was not rendered.
    expect(root.find('.Collection-wrapper')).toHaveLength(0);
  });

  it('does not update the page when removeAddon is called and there are still addons to show on the current page', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const addons = createFakeCollectionAddons();
    const addonId = addons[0].addon.id;
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
      // This will simulate a few items on the 2nd page.
      count: DEFAULT_API_PAGE_SIZE + 2,
    });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 2;
    const sort = COLLECTION_SORT_NAME;
    const location = createFakeLocation({
      query: { page, collection_sort: sort },
    });
    const history = createFakeHistory({ location });

    store.dispatch(
      loadCurrentCollection({
        addons,
        detail,
        pageSize: DEFAULT_API_PAGE_SIZE,
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
        username: detail.author.username,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);

    sinon.assert.notCalled(history.push);
  });

  it('updates the page when removeAddon removes the last addon on the page', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const addons = createFakeCollectionAddons();
    const addonId = addons[0].addon.id;
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
      // This will simulate only 1 item on the 2nd page.
      count: DEFAULT_API_PAGE_SIZE + 1,
    });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 2;
    const newPage = page - 1;
    const sort = COLLECTION_SORT_DATE_ADDED_DESCENDING;
    const location = createFakeLocation({
      query: { page, collectionSort: sort },
    });
    const history = createFakeHistory({ location });

    store.dispatch(
      loadCurrentCollection({
        addons,
        detail,
        pageSize: DEFAULT_API_PAGE_SIZE,
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
        username: detail.author.username,
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
    const authorUserId = 11;
    const slug = 'some-slug';
    const username = 'some-username';
    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: authorUserId,
          authorUsername: username,
          slug,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
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
        username,
      }),
    );
  });

  it('dispatches deleteCollectionAddonNotes when deleteNote is called', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const addons = createFakeCollectionAddons();
    const addonId = addons[0].addon.id;
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
    });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    store.dispatch(
      loadCurrentCollection({
        addons,
        detail,
        pageSize: DEFAULT_API_PAGE_SIZE,
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
        slug: detail.slug,
        username: detail.author.username,
      }),
    );
  });

  it('dispatches updateCollectionAddon when saveNote is called', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const addons = createFakeCollectionAddons();
    const addonId = addons[0].addon.id;
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
    });
    const errorHandler = createStubErrorHandler();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const notes = 'These are some notes.';
    const sort = COLLECTION_SORT_NAME;

    store.dispatch(
      loadCurrentCollection({
        addons,
        detail,
        pageSize: DEFAULT_API_PAGE_SIZE,
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
        notes,
        filters: { page, collectionSort: sort },
        slug: detail.slug,
        username: detail.author.username,
      }),
    );
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const props = getProps({
        match: {
          params: {
            username: 'foo',
            slug: 'collection-bar',
          },
        },
        location: createFakeLocation(),
      });

      expect(extractId(props)).toEqual('foo/collection-bar/');
    });

    it('adds the page as part of unique ID', () => {
      const props = getProps({
        match: {
          params: {
            username: 'foo',
            slug: 'collection-bar',
          },
        },
        location: createFakeLocation({ query: { page: 124 } }),
      });

      expect(extractId(props)).toEqual('foo/collection-bar/124');
    });
  });
});
