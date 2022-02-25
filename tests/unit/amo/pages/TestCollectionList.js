import { oneLine } from 'common-tags';
import * as React from 'react';

import CollectionList, {
  CollectionListBase,
  extractId,
} from 'amo/pages/CollectionList';
import {
  fetchUserCollections,
  loadUserCollections,
  FETCH_USER_COLLECTIONS,
} from 'amo/reducers/collections';
import AuthenticateButton from 'amo/components/AuthenticateButton';
import {
  createFakeCollectionDetail,
  createInternalCollectionWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import UserCollection from 'amo/components/UserCollection';
import { VIEW_CONTEXT_HOME } from 'amo/constants';
import { setViewContext } from 'amo/actions/viewContext';

describe(__filename, () => {
  const getProps = () => ({
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  });

  const renderComponent = ({ ...props } = {}) => {
    const allProps = {
      ...getProps(),
      ...props,
    };

    return shallowUntilTarget(
      <CollectionList {...allProps} />,
      CollectionListBase,
    );
  };

  it('dispatches fetchUserCollections for a logged in user with no collections loaded yet', () => {
    const userId = 1234;
    const { store } = dispatchSignInActions({ userId });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();

    renderComponent({ errorHandler, store });

    // This should be called with fetchUserCollections and with setViewContext.
    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(
      fakeDispatch,
      fetchUserCollections({
        errorHandlerId: errorHandler.id,
        userId,
      }),
    );
  });

  it('does not dispatch fetchUserCollections if there is no user', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    renderComponent({ store });

    sinon.assert.neverCalledWithMatch(fakeDispatch, {
      type: FETCH_USER_COLLECTIONS,
    });
  });

  it('does not dispatch fetchUserCollections if collections are loading', () => {
    const userId = 1234;
    const { store } = dispatchSignInActions({ userId });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler();

    store.dispatch(
      fetchUserCollections({
        errorHandlerId: errorHandler.id,
        userId,
      }),
    );

    fakeDispatch.resetHistory();

    renderComponent({ store });

    sinon.assert.neverCalledWithMatch(fakeDispatch, {
      type: FETCH_USER_COLLECTIONS,
    });
  });

  it('does not dispatch fetchUserCollections if collections are loaded', () => {
    const userId = 1234;
    const { store } = dispatchSignInActions({ userId });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    store.dispatch(
      loadUserCollections({
        collections: [createFakeCollectionDetail()],
        userId,
      }),
    );

    fakeDispatch.resetHistory();
    const errorHandler = createStubErrorHandler();
    renderComponent({ store, errorHandler });

    sinon.assert.neverCalledWithMatch(fakeDispatch, {
      type: FETCH_USER_COLLECTIONS,
    });
  });

  it('renders an AuthenticateButton without a logged in user', () => {
    const root = renderComponent();

    const button = root.find(AuthenticateButton);
    expect(button).toHaveLength(1);
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
    expect(root.find('.CollectionList-info')).toHaveProp(
      'header',
      'Collections',
    );
    expect(root.find('.CollectionList-info-text'))
      .toHaveText(oneLine`Collections make it easy to keep track of favorite
      add-ons and share your perfectly customized browser with others.`);

    const button = root.find('.CollectionList-create');
    expect(button).toHaveProp('buttonType', 'action');
    expect(button).toHaveProp('puffy', true);
    expect(button).toHaveProp('to', '/collections/add/');
    expect(button.childAt(0)).toHaveText('Create a collection');
  });

  it('renders placeholder text if the user has no collections', () => {
    const userId = 1234;
    const { store } = dispatchSignInActions({ userId });

    store.dispatch(
      loadUserCollections({
        collections: [],
        userId,
      }),
    );

    const root = renderComponent({ store });

    expect(root.find('.CollectionList-list')).toHaveLength(1);
    expect(root.find('.CollectionList-list')).toHaveProp(
      'header',
      'My collections',
    );
    expect(root.find('.CollectionList-list')).toHaveProp(
      'footer',
      'You do not have any collections.',
    );
    expect(root.find('.CollectionList-listing')).toHaveLength(0);
  });

  it('renders loading UserCollection objects if collections are loading', () => {
    const userId = 1234;
    const { store } = dispatchSignInActions({ userId });

    store.dispatch(
      fetchUserCollections({
        errorHandlerId: createStubErrorHandler().id,
        userId,
      }),
    );

    const root = renderComponent({ store });

    expect(root.find('.CollectionList-list')).toHaveLength(1);
    expect(root.find('.CollectionList-list')).toHaveProp('footer', null);
    expect(root.find('.CollectionList-listing')).toHaveLength(1);

    const userCollections = root.find(UserCollection);
    expect(userCollections).toHaveLength(4);
    for (let count = 0; count < 4; count++) {
      expect(userCollections.at(count)).toHaveProp('id', count);
      expect(userCollections.at(count)).toHaveProp('numberOfAddons', null);
    }
  });

  it('renders a list of collections', () => {
    const userId = 1234;
    const collections = [
      createFakeCollectionDetail({
        addon_count: 1,
        authorId: userId,
        id: 1,
        name: 'collection1',
        slug: 'collection-1',
      }),
      createFakeCollectionDetail({
        addon_count: 2,
        authorId: userId,
        id: 2,
        name: 'collection2',
        slug: 'collection-2',
      }),
    ];
    const { store } = dispatchSignInActions({ userId });

    store.dispatch(
      loadUserCollections({
        collections,
        userId,
      }),
    );

    const root = renderComponent({ store });

    expect(root.find('.CollectionList-listing')).toHaveLength(1);

    const userCollections = root.find(UserCollection);
    expect(userCollections).toHaveLength(2);

    userCollections.forEach((collection, index) => {
      const expected = createInternalCollectionWithLang({
        detail: collections[index],
      });

      expect(collection).toHaveProp('authorId', expected.authorId);
      expect(collection).toHaveProp('id', expected.id);
      expect(collection).toHaveProp('name', expected.name);
      expect(collection).toHaveProp('numberOfAddons', expected.numberOfAddons);
      expect(collection).toHaveProp('slug', expected.slug);
    });
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on currentUserId', () => {
      const currentUserId = 456;

      expect(extractId({ currentUserId })).toEqual(currentUserId);
    });

    it('returns a blank ID with no currentUserId', () => {
      expect(extractId({})).toEqual('');
    });
  });

  it('dispatches setViewContext when component mounts', () => {
    const { store } = dispatchSignInActions();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    renderComponent({ store });
    sinon.assert.calledWith(dispatchSpy, setViewContext(VIEW_CONTEXT_HOME));
  });
});
