import React from 'react';

import Collection, {
  CollectionBase,
  mapStateToProps,
} from 'amo/components/Collection';
import AddonsCard from 'amo/components/AddonsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Paginate from 'core/components/Paginate';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import {
  fetchCollection,
  fetchCollectionPage,
  loadCollection,
} from 'amo/reducers/collections';
import { createApiError } from 'core/api/index';
import { ErrorHandler } from 'core/errorHandler';
import {
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  const defaultCollectionDetail = createFakeCollectionDetail();
  const defaultUser = defaultCollectionDetail.author.username;
  const defaultSlug = defaultCollectionDetail.slug;

  const getProps = () => ({
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    i18n: fakeI18n(),
    location: { query: {} },
    params: {
      user: defaultUser,
      slug: defaultSlug,
    },
    store: dispatchClientMetadata().store,
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

  it('dispatches fetchCollection on mount', () => {
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';

    renderComponent({ errorHandler, params: { slug, user }, store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCollection({
      errorHandlerId: errorHandler.id,
      page: 1,
      slug,
      user,
    }));
  });

  it('passes the page from query string to fetchCollection', () => {
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';
    const page = 123;

    renderComponent({
      errorHandler,
      location: { query: { page } },
      params: { slug, user },
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchCollection({
      errorHandlerId: errorHandler.id,
      page,
      slug,
      user,
    }));
  });

  it('does not dispatch any action when nothing has changed', () => {
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // We need a collection for this test case.
    store.dispatch(loadCollection({
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
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // We need a collection for this test case.
    store.dispatch(loadCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const location = { query: {} };

    const wrapper = renderComponent({ location, store });
    fakeDispatch.reset();

    // This will trigger the componentWillReceiveProps() method.
    wrapper.setProps({ location });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when loading collection', () => {
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';

    store.dispatch(fetchCollection({
      errorHandlerId: errorHandler.id,
      slug,
      user,
    }));

    fakeDispatch.reset();
    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when loading collection page', () => {
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';

    store.dispatch(fetchCollectionPage({
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
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const wrapper = renderComponent({ dispatch: store.dispatch, store });

    const errorHandler = wrapper.instance().props.errorHandler;
    errorHandler.captureError(new Error('an unexpected error'));

    fakeDispatch.reset();
    wrapper.setProps({ collection: null, errorHandler });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchCollection when location pathname has changed', () => {
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // We need a collection for this test case.
    store.dispatch(loadCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'some-user';
    const page = 123;

    const location = {
      pathname: `/collections/${user}/${slug}/`,
      query: { page },
    };

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
    sinon.assert.calledWith(fakeDispatch, fetchCollection({
      errorHandlerId: errorHandler.id,
      page,
      slug: newSlug,
      user,
    }));
  });

  it('dispatches fetchCollectionPage when page has changed', () => {
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // We need a collection for this test case.
    store.dispatch(loadCollection({
      addons: createFakeCollectionAddons(),
      detail: defaultCollectionDetail,
    }));

    const page = 123;
    const location = { query: {} };
    const newLocation = { query: { page } };
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
    sinon.assert.calledWith(fakeDispatch, fetchCollectionPage({
      errorHandlerId: errorHandler.id,
      page,
      user: defaultUser,
      slug: defaultSlug,
    }));
  });

  it('dispatches fetchCollection when user param has changed', () => {
    const errorHandler = createStubErrorHandler();
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // We need a collection for this test case.
    store.dispatch(loadCollection({
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
    sinon.assert.calledWith(fakeDispatch, fetchCollection({
      errorHandlerId: errorHandler.id,
      page: 1,
      ...newParams,
    }));
  });

  it('dispatches fetchCollection when slug param has changed', () => {
    const errorHandler = createStubErrorHandler();
    const store = dispatchClientMetadata().store;
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // We need a collection for this test case.
    store.dispatch(loadCollection({
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
    sinon.assert.calledWith(fakeDispatch, fetchCollection({
      errorHandlerId: errorHandler.id,
      page: 1,
      ...newParams,
    }));
  });

  it('renders a collection', () => {
    const store = dispatchClientMetadata().store;

    const collectionAddons = createFakeCollectionAddons();
    const collectionDetail = createFakeCollectionDetail();

    store.dispatch(loadCollection({
      addons: collectionAddons,
      detail: collectionDetail,
    }));

    const wrapper = renderComponent({ store });
    expect(wrapper.find('.Collection-wrapper')).toHaveLength(1);
    expect(wrapper.find(AddonsCard)).toHaveLength(1);
    expect(wrapper.find(Paginate)).toHaveLength(1);
  });

  it('renders loading indicator on add-ons when fetching next page', () => {
    const store = dispatchClientMetadata().store;

    const errorHandler = createStubErrorHandler();
    const slug = 'collection-slug';
    const user = 'user-id-or-name';

    // User loads the collection page.
    store.dispatch(loadCollection({
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
    store.dispatch(fetchCollectionPage({
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

  it('renders NotFound page for unauthorized collection - 401 error', () => {
    const store = dispatchClientMetadata().store;

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'unauthorized' },
    }));

    const wrapper = renderComponent({ errorHandler, store });
    expect(wrapper.find(NotFound)).toHaveLength(1);
  });

  it('renders NotFound page for forbidden collection - 403 error', () => {
    const store = dispatchClientMetadata().store;

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(createApiError({
      response: { status: 403 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'forbidden' },
    }));

    const wrapper = renderComponent({ errorHandler, store });
    expect(wrapper.find(NotFound)).toHaveLength(1);
  });

  it('renders 404 page for missing collection', () => {
    const store = dispatchClientMetadata().store;

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
    const store = dispatchClientMetadata().store;

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
    const store = dispatchClientMetadata().store;

    // We need a collection for this test case.
    store.dispatch(loadCollection({
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
});
