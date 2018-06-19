import { oneLineTrim } from 'common-tags';
import * as React from 'react';

import CollectionList, {
  CollectionListBase,
} from 'amo/components/CollectionList';
import {
  fetchUserCollections,
  loadUserCollections,
} from 'amo/reducers/collections';
import AuthenticateButton from 'core/components/AuthenticateButton';
import {
  createStubErrorHandler,
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const getProps = () => ({
    i18n: fakeI18n(),
    location: fakeRouterLocation(),
    store: dispatchClientMetadata().store,
  });

  const renderComponent = ({ ...props } = {}) => {
    const allProps = {
      ...getProps(),
      ...props,
    };

    return shallowUntilTarget(
      <CollectionList {...allProps} />,
      CollectionListBase
    );
  };


  it('dispatches fetchUserCollections as expected', () => {
    const username = 'some-username';
    const { store } = dispatchSignInActions({ userProps: { username } });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();

    renderComponent({ errorHandler, store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, fetchUserCollections({
      errorHandlerId: errorHandler.id,
      username,
    }));
  });

  it('does not dispatch fetchUserCollections if there is no user', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch fetchUserCollections if collections are loading', () => {
    const username = 'some-username';
    const { store } = dispatchSignInActions({ userProps: { username } });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();

    store.dispatch(fetchUserCollections({
      errorHandlerId: errorHandler.id,
      username,
    }));

    fakeDispatch.resetHistory();

    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch fetchUserCollections if collections are loaded', () => {
    const username = 'some-username';
    const { store } = dispatchSignInActions({ userProps: { username } });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadUserCollections({
      collections: [createFakeCollectionDetail()],
      username,
    }));

    fakeDispatch.resetHistory();

    renderComponent({ store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('renders an AuthenticateButton without a logged in user', () => {
    const root = renderComponent();

    const button = root.find(AuthenticateButton);
    expect(button).toHaveLength(1);
    expect(button).toHaveProp('location', fakeRouterLocation());
    expect(button).toHaveProp('logInText', 'Log in to view your collections');
  });

  it('does not render an AuthenticateButton with a logged in user', () => {
    const { store } = dispatchSignInActions();
    const root = renderComponent({ store });

    expect(root.find(AuthenticateButton)).toHaveLength(0);
  });

  it('renders the collection listing info card', () => {
    const { store } = dispatchSignInActions();
    const root = renderComponent({ store });

    expect(root.find('.CollectionList-info')).toHaveLength(1);
    expect(root.find('.CollectionList-info'))
      .toHaveProp('header', 'My Collections');
    expect(root.find('.CollectionList-info-text'))
      .toHaveText(oneLineTrim`Collections make it easy to keep track of 
      favorite add-ons and share your perfectly customized browser with 
      others.`);

    const button = root.find('.CollectionList-create');
    expect(button).toHaveProp('buttonType', 'action');
    expect(button).toHaveProp('puffy', true);
    expect(button).toHaveProp('to', '/collections/add/');
    expect(button).toHaveProp('type', 'button');
    expect(button.childAt(0)).toHaveText('Create a collection');
  });

  it('renders an empty list if there are no collections', () => {
    const username = 'some-username';
    const { store } = dispatchSignInActions({ userProps: { username } });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadUserCollections({
      collections: [],
      username,
    }));

    fakeDispatch.resetHistory();

    const root = renderComponent({ store });

    expect(root.find('.CollectionList-list')).toHaveLength(1);
    expect(root.find('.CollectionList-list'))
      .toHaveProp('header', 'My Collections');
    expect(root.find('.CollectionList-listing')).toHaveLength(0);
  });

  it('renders a list of collections', () => {
    const username = 'some-username';
    const collections = [
      createFakeCollectionDetail({
        addon_count: 1,
        authorUsername: username,
      }),
      createFakeCollectionDetail({
        addon_count: 2,
        authorUsername: username,
      }),
    ];
    const { store } = dispatchSignInActions({ userProps: { username } });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(loadUserCollections({
      collections,
      username,
    }));

    fakeDispatch.resetHistory();

    const root = renderComponent({ store });

    expect(root.find('.CollectionList-listing')).toHaveLength(1);
    root.find('.CollectionList-collection').forEach((collection, index) => {
      const expectedCollection = collections[index];
      expect(collection).toHaveLength(1);
      expect(collection.find('.CollectionList-collection-link'))
        .toHaveProp(
          'href',
          oneLineTrim`/collections/${expectedCollection.author.username}/
          ${expectedCollection.slug}/`
        );
      expect(collection.find('.CollectionList-collection-name').childAt(0))
        .toHaveText(expectedCollection.name);
      expect(collection.find('.CollectionList-collection-number').childAt(0))
        .toHaveText(index === 0 ? '1 add-on' : '2 add-ons');
    });
  });
});
