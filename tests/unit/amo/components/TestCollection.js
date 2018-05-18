import * as React from 'react';

import Collection, {
  CollectionBase,
  extractId,
  mapStateToProps,
} from 'amo/components/Collection';
import AddonsCard from 'amo/components/AddonsCard';
import CollectionManager from 'amo/components/CollectionManager';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import AuthenticateButton from 'core/components/AuthenticateButton';
import Paginate from 'core/components/Paginate';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import {
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  loadCurrentCollection,
} from 'amo/reducers/collections';
import { createApiError } from 'core/api/index';
import { COLLECTIONS_EDIT } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import {
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
      user: defaultUser,
      slug: defaultSlug,
    },
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

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: {
        ...defaultCollectionDetail,
        description: 'Apples &amp; carrots',
      },
    }));
    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-description').html())
      .toContain('Apples &amp; carrots');
  });

  it('renders loading indicators when there is no collection', () => {
    const wrapper = renderComponent({ collection: null });

    // We display 5 items on the detail card: title, description, number of
    // addons, creator, and last modified date.
    // 3 items are rendered by `MetadataCard` though and will render
    // as `LoadingText` if null; so we just make sure it has `null`
    // props for the last three.
    expect(wrapper.find('.Collection-detail').find(LoadingText))
      .toHaveLength(2);
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
    const { store } = dispatchClientMetadata();
    const collectionDetail = createFakeCollectionDetail();

    store.dispatch(loadCurrentCollection({
      addons: [],
      detail: collectionDetail,
    }));

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(1);
    expect(wrapper.find('.Collection-placeholder')
      .text()).toEqual('Search for extensions and themes to add to your collection.');
  });

  it('hides placeholder text if there are add-ons', () => {
    const { store } = dispatchClientMetadata();

    const collectionAddons = createFakeCollectionAddons();
    const collectionDetail = createFakeCollectionDetail();

    store.dispatch(loadCurrentCollection({
      addons: collectionAddons,
      detail: collectionDetail,
    }));

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-placeholder')).toHaveLength(0);
  });

  it('dispatches fetchCurrentCollection on mount', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';

    renderComponent({ errorHandler, params: { slug, user }, store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollection({
      errorHandlerId: errorHandler.id,
      page: undefined,
      slug,
      user,
    }));
  });

  it('dispatches fetchCurrentCollectionPage with correct params for editing on mount', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    fakeDispatch.reset();

    renderComponent({ editing: true, errorHandler, store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollectionPage({
      errorHandlerId: errorHandler.id,
      page: 1,
      slug: defaultSlug,
      user: defaultUser,
    }));
  });

  it('passes the page from query string to fetchCurrentCollection', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';
    const page = 123;

    renderComponent({
      errorHandler,
      location: fakeRouterLocation({ query: { page } }),
      params: { slug, user },
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollection({
      errorHandlerId: errorHandler.id,
      page,
      slug,
      user,
    }));
  });

  it('does not dispatch any action when nothing has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({ store });
    fakeDispatch.reset();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps();

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when location has not changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const location = fakeRouterLocation();

    const wrapper = renderComponent({ location, store });
    fakeDispatch.reset();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({ location });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when loading collection', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';

    store.dispatch(fetchCurrentCollection({
      errorHandlerId: errorHandler.id,
      slug,
      user,
    }));

    fakeDispatch.reset();
    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when loading collection page', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';

    store.dispatch(fetchCurrentCollectionPage({
      errorHandlerId: errorHandler.id,
      page: 123,
      slug,
      user,
    }));

    fakeDispatch.reset();
    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when there is an error', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const wrapper = renderComponent({ dispatch: store.dispatch, store });

    const { errorHandler } = wrapper.instance().props;
    errorHandler.captureError(new Error('an unexpected error'));

    fakeDispatch.reset();
    wrapper.setProps({ collection: null, errorHandler });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchCurrentCollection when location pathname has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';
    const page = 123;

    const location = fakeRouterLocation({
      pathname: `/collections/${user}/${slug}/`,
      query: { page },
    });

    const newSlug = 'other-collection';
    const newLocation = {
      ...location,
      pathname: `/collections/${user}/${newSlug}/`,
    };

    const wrapper = renderComponent({
      errorHandler,
      location,
      params: { slug, user },
      store,
    });
    fakeDispatch.reset();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({
      location: newLocation,
      params: { slug: newSlug, user },
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollection({
      errorHandlerId: errorHandler.id,
      page,
      slug: newSlug,
      user,
    }));
  });

  it('dispatches fetchCurrentCollectionPage when page has changed', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const page = 123;
    const location = fakeRouterLocation();
    const newLocation = fakeRouterLocation({ query: { page } });
    const errorHandler = createStubErrorHandler();

    const wrapper = renderComponent({
      errorHandler,
      location,
      store,
    });
    fakeDispatch.reset();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({ location: newLocation });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollectionPage({
      errorHandlerId: errorHandler.id,
      page,
      user: defaultUser,
      slug: defaultSlug,
    }));
  });

  it('defaults to first page when there is no page and collection is loaded', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
      page: 2,
    }));

    // This happens when a user clicks the "back" button in the browser, after
    // having browsed a collection and navigated to the second page.
    // See: https://github.com/mozilla/addons-frontend/issues/4933
    const page = null;
    const location = fakeRouterLocation();
    const newLocation = fakeRouterLocation({ query: { page } });
    const errorHandler = createStubErrorHandler();

    const wrapper = renderComponent({
      errorHandler,
      location,
      store,
    });
    fakeDispatch.reset();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({ location: newLocation });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollectionPage({
      errorHandlerId: errorHandler.id,
      page: 1,
      user: defaultUser,
      slug: defaultSlug,
    }));
  });

  it('dispatches fetchCurrentCollection when user param has changed', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({
      errorHandler,
      store,
    });
    fakeDispatch.reset();

    const newParams = {
      slug: defaultSlug,
      user: 'another-user',
    };
    wrapper.setProps({ params: newParams });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollection({
      errorHandlerId: errorHandler.id,
      page: undefined,
      ...newParams,
    }));
  });

  it('compares user values in lower case', () => {
    const user = 'Mozilla';
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: createFakeCollectionDetail({ authorUsername: user }),
    }));
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const wrapper = renderComponent({ errorHandler, store });
    fakeDispatch.reset();

    wrapper.setProps({
      params: { slug: defaultSlug, user: user.toLowerCase() },
    });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchCurrentCollection when slug param has changed', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({
      errorHandler,
      store,
    });
    fakeDispatch.reset();

    const newParams = {
      slug: 'some-other-collection-slug',
      user: defaultUser,
    };
    wrapper.setProps({ params: newParams });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCurrentCollection({
      errorHandlerId: errorHandler.id,
      page: undefined,
      ...newParams,
    }));
  });

  it('renders a collection', () => {
    const { store } = dispatchClientMetadata();

    const pathname = `/collections/${defaultUser}/${defaultSlug}/`;

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({ store });
    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard))
      .toHaveProp('editing', false);
    expect(wrapper.find(Paginate)).toHaveProp('pathname', pathname);
    expect(wrapper.find('.Collection-edit-link')).toHaveLength(0);
  });

  it('renders a collection for editing', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [COLLECTIONS_EDIT],
      },
    });

    const pathname = `/collections/${defaultUser}/${defaultSlug}/edit/`;

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({ editing: true, store });

    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard))
      .toHaveProp('editing', true);
    expect(wrapper.find(Paginate)).toHaveProp('pathname', pathname);
    expect(wrapper.find(CollectionManager)).toHaveLength(1);

    // Make sure these were not rendered.
    expect(wrapper.find('.Collection-title')).toHaveLength(0);
    expect(wrapper.find('.Collection-description')).toHaveLength(0);
    expect(wrapper.find(MetadataCard)).toHaveLength(0);
  });

  it('does not render the pagination when no add-ons in the collection', () => {
    const { store } = dispatchClientMetadata();

    const collectionAddons = createFakeCollectionAddons({ addons: [] });
    const collectionDetail = createFakeCollectionDetail({ count: 0 });

    store.dispatch(loadCurrentCollection({
      addons: collectionAddons,
      detail: collectionDetail,
    }));

    const wrapper = renderComponent({ store });
    expect(wrapper.find(Paginate)).toHaveLength(0);
  });

  it('renders loading indicator on add-ons when fetching next page', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = createStubErrorHandler();
    const { slug } = defaultCollectionDetail;
    const user = defaultUser;

    // User loads the collection page.
    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({
      errorHandler,
      params: { slug, user },
      store,
    });

    expect(wrapper.find(AddonsCard)).toHaveProp('loading', false);

    // User clicks on 'next' pagination link.
    store.dispatch(fetchCurrentCollectionPage({
      errorHandlerId: errorHandler.id,
      page: 2,
      slug,
      user,
    }));

    // This is needed because shallowUntilTarget() does not trigger any
    // lifecycle methods.
    wrapper.setProps(mapStateToProps(store.getState()));

    expect(wrapper.find(AddonsCard)).toHaveProp('loading', true);
    // We should not update the collection detail card.
    expect(wrapper.find('.Collection-detail').find(LoadingText))
      .toHaveLength(0);
  });

  it('renders 404 page for missing collection', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(createApiError({
      response: { status: 404 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'not found' },
    }));

    const wrapper = renderComponent({ errorHandler, store });
    expect(wrapper.find(NotFound)).toHaveLength(1);
  });

  it('renders an error if one exists', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(createApiError({
      response: { status: 500 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'Nope.' },
    }));

    const wrapper = renderComponent({ errorHandler, store });
    expect(wrapper.find(ErrorList)).toHaveLength(1);
  });

  it('renders an HTML title', () => {
    const { store } = dispatchClientMetadata();

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({ store });
    expect(wrapper.find('title')).toHaveText(defaultCollectionDetail.name);
  });

  it('does not render an HTML when there is no collection loaded', () => {
    const wrapper = renderComponent();
    expect(wrapper.find('title')).toHaveLength(0);
  });

  it('renders an edit link when user has `Collections:Edit` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [COLLECTIONS_EDIT],
      },
    });

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({ store });

    expect(wrapper.find('.Collection-edit-link')).toHaveLength(1);
  });

  it('links to a Collection edit page', () => {
    // Turn off edit-overlay feature so that the component renders a link.
    const fakeConfig = getFakeConfig({ enableNewCollectionsUI: false });
    const { store } = dispatchSignInActions({
      userProps: { permissions: [COLLECTIONS_EDIT] },
    });

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({ store, _config: fakeConfig });

    const editLink = wrapper.find('.Collection-edit-link').find(Link);
    expect(editLink).toHaveLength(1);
    expect(editLink).toHaveProp('href',
      `/collections/${defaultUser}/${defaultCollectionDetail.slug}/edit/`);
  });

  it('links internally to a Collection edit page', () => {
    // Turn on the edit-collection feature.
    const fakeConfig = getFakeConfig({ enableNewCollectionsUI: true });
    const { store } = dispatchSignInActions({
      userProps: { permissions: [COLLECTIONS_EDIT] },
    });

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const wrapper = renderComponent({ store, _config: fakeConfig });

    const editLink = wrapper.find('.Collection-edit-link').find(Link);
    expect(editLink).toHaveLength(1);
    expect(editLink).toHaveProp('to',
      `/collections/${defaultUser}/${defaultCollectionDetail.slug}/edit/`);
  });

  it('renders an edit link when user is the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: createFakeCollectionDetail({
        authorId: authorUserId,
      }),
    }));

    const wrapper = renderComponent({ store });
    expect(wrapper.find('.Collection-edit-link')).toHaveLength(1);
  });

  it('passes a collection to CollectionManager when editing', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [COLLECTIONS_EDIT],
      },
    });

    const collectionDetail = createFakeCollectionDetail();
    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: collectionDetail,
    }));
    const root = renderComponent({ store, editing: true });

    const manager = root.find(CollectionManager);
    expect(manager).toHaveProp('collection');
    expect(manager.prop('collection').id).toEqual(collectionDetail.id);
  });

  it('passes the correct editing flag to AddonsCard when editing', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [COLLECTIONS_EDIT],
      },
    });

    const collectionDetail = createFakeCollectionDetail();
    store.dispatch(loadCurrentCollection({
      addons: createFakeCollectionAddons(),
      detail: collectionDetail,
    }));
    const root = renderComponent({ store, editing: true });

    expect(root.find(AddonsCard)).toHaveProp('editing', true);
  });

  it('passes a null collection to CollectionManager when editing', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [COLLECTIONS_EDIT],
      },
    });

    const root = renderComponent({ store, editing: true });

    const manager = root.find(CollectionManager);
    expect(manager).toHaveProp('collection', null);
  });

  it('renders AuthenticateButton when editing and not signed in', () => {
    const { store } = dispatchClientMetadata();
    const location = fakeRouterLocation({
      pathname: '/current/edit/url/',
    });
    const root = renderComponent({ store, editing: true, location });

    const authButton = root.find(AuthenticateButton);
    expect(authButton).toHaveProp('location', location);

    // Make sure these were not rendered.
    expect(root.find(CollectionManager)).toHaveLength(0);
    expect(root.find('.Collection-title')).toHaveLength(0);
    expect(root.find('.Collection-description')).toHaveLength(0);
    expect(root.find(MetadataCard)).toHaveLength(0);
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const props = getProps({
        params: {
          user: 'foo',
          slug: 'collection-bar',
        },
        location: fakeRouterLocation(),
      });

      expect(extractId(props)).toEqual('foo/collection-bar/');
    });

    it('adds the page as part of unique ID', () => {
      const props = getProps({
        params: {
          user: 'foo',
          slug: 'collection-bar',
        },
        location: fakeRouterLocation({ query: { page: 124 } }),
      });

      expect(extractId(props)).toEqual('foo/collection-bar/124');
    });
  });
});
