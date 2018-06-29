import { shallow } from 'enzyme';
import * as React from 'react';

import Collection, {
  CollectionBase,
  extractId,
  mapStateToProps,
} from 'amo/components/Collection';
import AddonsCard from 'amo/components/AddonsCard';
import CollectionManager from 'amo/components/CollectionManager';
import NotFound from 'amo/components/ErrorPage/NotFound';
import AuthenticateButton from 'core/components/AuthenticateButton';
import Paginate from 'core/components/Paginate';
import Button from 'ui/components/Button';
import ConfirmButton from 'ui/components/ConfirmButton';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
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
  CLIENT_APP_FIREFOX,
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
  createFakeRouter,
  createStubErrorHandler,
  fakeI18n,
  fakeRouterLocation,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const defaultCollectionDetail = createFakeCollectionDetail();
  const defaultUser = defaultCollectionDetail.author.username;
  const defaultSlug = defaultCollectionDetail.slug;

  const getProps = ({ ...otherProps } = {}) => ({
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    location: fakeRouterLocation(),
    params: {
      username: defaultUser,
      slug: defaultSlug,
    },
    router: createFakeRouter(),
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

  it('renders itself', () => {
    const wrapper = renderComponent();

    expect(wrapper.find('.Collection')).toHaveLength(1);
    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
  });

  it('allows HTML entities in the Collection description', () => {
    const { store } = dispatchClientMetadata();

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: {
          ...defaultCollectionDetail,
          description: 'Apples &amp; carrots',
        },
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );
    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-description').html()).toContain(
      'Apples &amp; carrots',
    );
  });

  it('renders loading indicators when there is no collection', () => {
    const wrapper = renderComponent({ collection: null });

    // We display 5 items on the detail card: title, description, number of
    // addons, creator, and last modified date.
    // 3 items are rendered by `MetadataCard` though and will render
    // as `LoadingText` if null; so we just make sure it has `null`
    // props for the last three.
    expect(wrapper.find('.Collection-detail').find(LoadingText)).toHaveLength(
      2,
    );
    const contents = wrapper
      .find(MetadataCard)
      .prop('metadata')
      .map(({ content } = {}) => {
        return content;
      });
    expect(contents).toEqual([null, null, null]);
    expect(wrapper.find(AddonsCard)).toHaveProp('loading', true);
  });

  it('renders placeholder text if there are no add-ons', () => {
    const { store } = dispatchSignInActions();
    const collectionDetail = createFakeCollectionDetail();

    store.dispatch(
      loadCurrentCollection({
        addons: [],
        detail: collectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

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

    store.dispatch(
      loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('hides placeholder text when viewing a collection if the user is not logged in', () => {
    const { store } = dispatchClientMetadata();

    const collectionDetail = createFakeCollectionDetail();

    store.dispatch(
      loadCurrentCollection({
        addons: [],
        detail: collectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('dispatches fetchCurrentCollection on mount', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const username = 'some-user';

    renderComponent({ errorHandler, params: { slug, username }, store });

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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

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
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
      params: { slug, username },
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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });
    fakeDispatch.resetHistory();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps();

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when location has not changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const location = fakeRouterLocation();

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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const username = 'some-user';
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    const location = fakeRouterLocation({
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
      params: { slug, username },
      store,
    });
    fakeDispatch.resetHistory();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({
      location: newLocation,
      params: { slug: newSlug, username },
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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const errorHandler = createStubErrorHandler();

    const wrapper = renderComponent({
      errorHandler,
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const errorHandler = createStubErrorHandler();

    const wrapper = renderComponent({
      errorHandler,
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({
      errorHandler,
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
      store,
    });
    fakeDispatch.resetHistory();

    const newParams = {
      slug: defaultSlug,
      username: 'another-user',
    };
    wrapper.setProps({ params: newParams });

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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({ authorUsername: username }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const wrapper = renderComponent({ errorHandler, store });
    fakeDispatch.resetHistory();

    wrapper.setProps({
      params: { slug: defaultSlug, username: username.toLowerCase() },
    });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchCurrentCollection when slug param has changed', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const page = 123;
    const sort = COLLECTION_SORT_NAME;

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({
      errorHandler,
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
      store,
    });
    fakeDispatch.resetHistory();

    const newParams = {
      slug: 'some-other-collection-slug',
      username: defaultUser,
    };
    wrapper.setProps({ params: newParams });

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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({
      location: fakeRouterLocation({ query: queryParams }),
      params: { username, slug },
      store,
    });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveProp('editing', false);
  });

  it('renders a collection with pagination', () => {
    const slug = 'some-slug';
    const username = 'some-username';
    const page = 2;
    const sort = COLLECTION_SORT_NAME;
    const filters = { page, sort };

    const { store } = dispatchClientMetadata();

    const detail = createFakeCollectionDetail({
      authorUsername: username,
      count: 10,
      slug,
    });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail,
        // With a pageSize < count, the pagination will be displayed.
        pageSize: 5,
      }),
    );

    const wrapper = renderComponent({
      location: fakeRouterLocation({ query: filters }),
      params: { username, slug },
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
    expect(paginator).toHaveProp('queryParams', queryParams);
    expect(wrapper.find('.Collection-edit-link')).toHaveLength(0);
  });

  it('declares an install source for non-featured collections', () => {
    const { store } = dispatchClientMetadata();

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
      }),
    );

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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
      }),
    );

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

  it('renders a sort card', () => {
    const sort = COLLECTION_SORT_NAME;

    const wrapper = renderComponent({
      location: fakeRouterLocation({ query: { collection_sort: sort } }),
    });

    const sortOptions = wrapper.instance().sortOptions();

    expect(wrapper.find('.Collection-sort')).toHaveLength(1);
    expect(wrapper.find('.Sort-label')).toHaveText('Sort add-ons by');
    expect(wrapper.find('.Sort-select')).toHaveProp('defaultValue', sort);
    expect(wrapper.find('.Sort-select')).toHaveProp(
      'onChange',
      wrapper.instance().onSortSelect,
    );

    const options = wrapper.find('.Sort-select').children();
    sortOptions.forEach((option, index) => {
      expect(options.at(index)).toHaveProp('value', option.value);
      expect(options.at(index)).toHaveText(option.children);
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

    store.dispatch(
      loadCurrentCollection({
        addons,
        detail,
        pageSize,
      }),
    );

    const wrapper = renderComponent({
      editing: true,
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
      params: { username, slug },
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

    // Make sure these were not rendered.
    expect(wrapper.find('.Collection-title')).toHaveLength(0);
    expect(wrapper.find('.Collection-description')).toHaveLength(0);
    expect(wrapper.find(MetadataCard)).toHaveLength(0);
  });

  it('renders a create collection page', () => {
    const { store } = dispatchSignInActions();

    const wrapper = renderComponent({ creating: true, store });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveLength(0);
    expect(wrapper.find(CollectionManager)).toHaveLength(1);
    expect(wrapper.find(CollectionManager)).toHaveProp('creating', true);

    // Make sure these were not rendered.
    expect(wrapper.find('.Collection-title')).toHaveLength(0);
    expect(wrapper.find('.Collection-description')).toHaveLength(0);
    expect(wrapper.find(MetadataCard)).toHaveLength(0);
  });

  it('does not render the pagination when no add-ons in the collection', () => {
    const { store } = dispatchClientMetadata();

    const collectionAddons = createFakeCollectionAddons({ addons: [] });
    const collectionDetail = createFakeCollectionDetail({ count: 0 });

    store.dispatch(
      loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });
    expect(wrapper.find(AddonsCard).prop('footer')).toEqual(null);
  });

  it('renders loading indicator on add-ons when fetching next page', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = createStubErrorHandler();
    const { slug } = defaultCollectionDetail;
    const username = defaultUser;

    // User loads the collection page.
    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({
      errorHandler,
      params: { slug, username },
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

    // This is needed because shallowUntilTarget() does not trigger any
    // lifecycle methods.
    wrapper.setProps(
      mapStateToProps(store.getState(), { location: fakeRouterLocation() }),
    );

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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: defaultCollectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

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

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorUsername: username,
          slug,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-edit-link')).toHaveLength(1);
  });

  it('does not render an edit link for a mozilla collection when user does not have the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions();

    const slug = 'some-slug';
    const username = MOZILLA_COLLECTIONS_USERNAME;

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorUsername: username,
          slug,
        }),
      }),
    );

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-edit-link')).toHaveLength(0);
  });

  it('renders an edit link for a the Featured Themes collection when user has the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const slug = FEATURED_THEMES_COLLECTION_SLUG;
    const username = MOZILLA_COLLECTIONS_USERNAME;

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorUsername: username,
          slug,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-edit-link')).toHaveLength(1);
  });

  it('does not render an edit link for a the Featured Themes collection when user does not have the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions();

    const slug = FEATURED_THEMES_COLLECTION_SLUG;
    const username = MOZILLA_COLLECTIONS_USERNAME;

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorUsername: username,
          slug,
        }),
      }),
    );

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-edit-link')).toHaveLength(0);
  });

  it('links to a Collection edit page', () => {
    // Turn off the enableNewCollectionsUI feature so that the component renders a link.
    const fakeConfig = getFakeConfig({ enableNewCollectionsUI: false });
    const authorUserId = 11;

    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: authorUserId,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store, _config: fakeConfig });

    const editLink = wrapper.find('.Collection-edit-link').find(Button);
    expect(editLink).toHaveLength(1);
    expect(editLink).toHaveProp(
      'href',
      `/collections/${defaultUser}/${defaultCollectionDetail.slug}/edit/`,
    );
  });

  it('links internally to a Collection edit page', () => {
    // Turn on the enableNewCollectionsUI feature.
    const fakeConfig = getFakeConfig({ enableNewCollectionsUI: true });
    const authorUserId = 11;
    const queryParams = { page: 133, collection_sort: COLLECTION_SORT_NAME };

    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: authorUserId,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({
      _config: fakeConfig,
      location: fakeRouterLocation({ query: queryParams }),
      store,
    });

    const editLink = wrapper.find('.Collection-edit-link').find(Button);
    expect(editLink).toHaveLength(1);
    expect(editLink).toHaveProp('to', {
      pathname: `/collections/${defaultUser}/${
        defaultCollectionDetail.slug
      }/edit/`,
      query: queryParams,
    });
  });

  it('renders an edit link when user is the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: authorUserId,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });
    expect(wrapper.find('.Collection-edit-link')).toHaveLength(1);
  });

  it('does not render an edit link when user is not the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: 99 });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: authorUserId,
        }),
      }),
    );

    const wrapper = renderComponent({ store });
    expect(wrapper.find('.Collection-edit-link')).toHaveLength(0);
  });

  it('renders a delete button when user is the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: authorUserId,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });
    expect(wrapper.find(ConfirmButton)).toHaveLength(1);
  });

  it('does not render a delete button when user is not the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: 99,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const wrapper = renderComponent({ store });
    expect(wrapper.find(ConfirmButton)).toHaveLength(0);
  });

  it('passes a collection to CollectionManager when editing', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });
    const detail = createFakeCollectionDetail({
      authorId: authorUserId,
    });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const root = renderComponent({ store, editing: true });

    const manager = root.find(CollectionManager);
    expect(manager).toHaveProp('collection');
    expect(manager.prop('collection').id).toEqual(detail.id);
  });

  it('passes the correct editing flag to AddonsCard when editing', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(
      loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: createFakeCollectionDetail({
          authorId: authorUserId,
        }),
        pageSize: DEFAULT_API_PAGE_SIZE,
      }),
    );

    const root = renderComponent({ store, editing: true });

    expect(root.find(AddonsCard)).toHaveProp('editing', true);
  });

  it('passes a null collection to CollectionManager when editing', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const root = renderComponent({ store, editing: true });

    const manager = root.find(CollectionManager);
    expect(manager).toHaveProp('collection', null);
  });

  it('renders AuthenticateButton when creating and not signed in', () => {
    const { store } = dispatchClientMetadata();
    const location = fakeRouterLocation({
      pathname: '/create/url/',
    });
    const root = renderComponent({ store, creating: true, location });

    const authButton = root.find(AuthenticateButton);
    expect(authButton).toHaveProp('location', location);
    expect(authButton).toHaveProp('logInText', 'Log in to create a collection');

    // Make sure these were not rendered.
    expect(root.find(CollectionManager)).toHaveLength(0);
    expect(root.find('.Collection-title')).toHaveLength(0);
    expect(root.find('.Collection-description')).toHaveLength(0);
    expect(root.find(MetadataCard)).toHaveLength(0);
  });

  it('renders AuthenticateButton when editing and not signed in', () => {
    const { store } = dispatchClientMetadata();
    const location = fakeRouterLocation({
      pathname: '/current/edit/url/',
    });
    const root = renderComponent({ store, editing: true, location });

    const authButton = root.find(AuthenticateButton);
    expect(authButton).toHaveProp('location', location);
    expect(authButton).toHaveProp(
      'logInText',
      'Log in to edit this collection',
    );

    // Make sure these were not rendered.
    expect(root.find(CollectionManager)).toHaveLength(0);
    expect(root.find('.Collection-title')).toHaveLength(0);
    expect(root.find('.Collection-description')).toHaveLength(0);
    expect(root.find(MetadataCard)).toHaveLength(0);
  });

  it('dispatches removeAddonFromCollection when removeAddon is called', () => {
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
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
      store,
    });

    fakeDispatch.resetHistory();

    // This simulates the user clicking the "Remove" button on the
    // EditableCollectionAddon component.
    root.instance().removeAddon(addonId);
    sinon.assert.callCount(fakeDispatch, 1);
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
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
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
      location: fakeRouterLocation({ query: { page, collection_sort: sort } }),
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

  describe('onSortSelect', () => {
    it.each([true, false])(
      `calls router.push with expected pathname and query when a sort is selected and editing is %s`,
      (editing) => {
        const slug = 'some-slug';
        const username = 'some-username';
        const page = 2;
        const sort = COLLECTION_SORT_NAME;
        const clientApp = CLIENT_APP_FIREFOX;
        const lang = 'en-US';
        const queryParams = { page, collection_sort: sort };

        const { store } = dispatchClientMetadata({ clientApp, lang });
        const router = createFakeRouter();

        const wrapper = renderComponent({
          editing,
          location: fakeRouterLocation({ query: queryParams }),
          params: { username, slug },
          router,
          store,
        });

        const select = wrapper.find('.Sort-select');

        const fakeEvent = createFakeEvent({
          currentTarget: { value: sort },
        });

        select.simulate('change', fakeEvent);

        const pathname = `/${lang}/${clientApp}/collections/${username}/${slug}/${
          editing ? 'edit/' : ''
        }`;

        sinon.assert.callCount(router.push, 1);
        sinon.assert.calledWith(router.push, {
          pathname,
          query: queryParams,
        });
      },
    );
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const props = getProps({
        params: {
          username: 'foo',
          slug: 'collection-bar',
        },
        location: fakeRouterLocation(),
      });

      expect(extractId(props)).toEqual('foo/collection-bar/');
    });

    it('adds the page as part of unique ID', () => {
      const props = getProps({
        params: {
          username: 'foo',
          slug: 'collection-bar',
        },
        location: fakeRouterLocation({ query: { page: 124 } }),
      });

      expect(extractId(props)).toEqual('foo/collection-bar/124');
    });
  });
});
