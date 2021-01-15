import * as React from 'react';
/* global window */

import AutoSearchInput from 'amo/components/AutoSearchInput';
import CollectionAddAddon, {
  CollectionAddAddonBase,
  addonAddedAction,
  addonRemovedAction,
  extractId,
  mapStateToProps,
  MESSAGE_RESET_TIME,
} from 'amo/components/CollectionAddAddon';
import {
  addAddonToCollection,
  addonAddedToCollection,
  addonRemovedFromCollection,
} from 'amo/reducers/collections';
import {
  applyUIStateChanges,
  createFakeAutocompleteResult,
  createFakeCollectionDetail,
  createInternalCollectionWithLang,
  createInternalSuggestionWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
  simulateComponentCallback,
} from 'tests/unit/helpers';
import Card from 'amo/components/Card';
import ErrorList from 'amo/components/ErrorList';
import Notice from 'amo/components/Notice';

const simulateAutoSearchCallback = (props = {}) => {
  return simulateComponentCallback({
    Component: AutoSearchInput,
    ...props,
  });
};

const _addonAddedToCollection = ({ userId, root, store }) => {
  store.dispatch(
    addonAddedToCollection({
      addonId: 123,
      collectionId: 321,
      userId,
    }),
  );

  // Simulate a Redux state update.
  root.setProps(mapStateToProps(store.getState()));

  applyUIStateChanges({ root, store });
};

const _addonRemovedFromCollection = ({ root, store }) => {
  store.dispatch(addonRemovedFromCollection());

  // Simulate a Redux state update.
  root.setProps(mapStateToProps(store.getState()));

  applyUIStateChanges({ root, store });
};

describe(__filename, () => {
  const signedInUserId = 123;

  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(Date.now());
  });

  afterEach(() => {
    clock.restore();
  });

  const dispatchSignedInUser = ({ userId = signedInUserId }) => {
    return dispatchSignInActions({ userId });
  };

  const getProps = ({
    collection = createInternalCollectionWithLang({
      detail: createFakeCollectionDetail(),
    }),
    ...customProps
  }) => {
    return {
      collection,
      filters: {},
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);
    return shallowUntilTarget(
      <CollectionAddAddon {...props} />,
      CollectionAddAddonBase,
    );
  };

  it('renders any error', () => {
    const errorHandler = createStubErrorHandler(
      new Error('Unexpected API error'),
    );
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('renders a Card with an AutoSearchInput', () => {
    const root = render();

    expect(root.find(Card)).toHaveLength(1);
    expect(root.find(AutoSearchInput)).toHaveLength(1);
  });

  it('dispatches addAddonToCollection when selecting an add-on', () => {
    const authorId = 123;
    const currentUserId = authorId + 100;

    const { store } = dispatchSignedInUser({
      userId: currentUserId,
    });
    const filters = { page: 2 };
    const errorHandler = createStubErrorHandler();

    const collection = createInternalCollectionWithLang({
      detail: createFakeCollectionDetail({ authorId }),
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler, filters, store });

    const suggestion = createInternalSuggestionWithLang(
      createFakeAutocompleteResult({ name: 'uBlock Origin' }),
    );
    const selectSuggestion = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    selectSuggestion(suggestion);

    sinon.assert.calledWith(
      dispatchSpy,
      addAddonToCollection({
        addonId: suggestion.addonId,
        collectionId: collection.id,
        slug: collection.slug,
        editing: true,
        errorHandlerId: errorHandler.id,
        filters,
        userId: authorId,
      }),
    );
  });

  it('displays a notification for 5 seconds after an add-on has been added', () => {
    const { store } = dispatchSignedInUser({
      userId: signedInUserId,
    });
    const root = render({ setTimeout: window.setTimeout, store });

    expect(root.find(Notice)).toHaveLength(0);

    _addonAddedToCollection({ userId: signedInUserId, root, store });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice).children()).toHaveText('Added to collection');
    expect(root.find(Notice)).toHaveProp('type', 'success');

    expect(root.instance().props.uiState.addonAction).toEqual(addonAddedAction);

    // Trigger the setTimeout behavior.
    clock.tick(MESSAGE_RESET_TIME);

    applyUIStateChanges({ root, store });
    expect(root.instance().props.uiState.addonAction).toEqual(null);
    expect(root.find(Notice)).toHaveLength(0);
  });

  it('displays a notification for 5 seconds after an add-on has been removed', () => {
    const { store } = dispatchSignedInUser({
      userId: signedInUserId,
    });
    const root = render({ setTimeout: window.setTimeout, store });

    expect(root.find(Notice)).toHaveLength(0);

    _addonRemovedFromCollection({ root, store });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice).children()).toHaveText('Removed from collection');
    expect(root.find(Notice)).toHaveProp('type', 'generic');

    expect(root.instance().props.uiState.addonAction).toEqual(
      addonRemovedAction,
    );

    // Trigger the setTimeout behavior.
    clock.tick(MESSAGE_RESET_TIME);

    applyUIStateChanges({ root, store });
    expect(root.instance().props.uiState.addonAction).toEqual(null);
    expect(root.find(Notice)).toHaveLength(0);
  });

  it('clears the errorHandler when an add-on is added', () => {
    const errorHandler = createStubErrorHandler(
      new Error('Unexpected API error'),
    );
    const clearStub = sinon.stub(errorHandler, 'clear');
    const { store } = dispatchSignedInUser({
      userId: signedInUserId,
    });

    const root = render({ errorHandler, store });

    _addonAddedToCollection({ userId: signedInUserId, root, store });

    sinon.assert.called(clearStub);
  });

  it('clears the errorHandler when an add-on is removed', () => {
    const errorHandler = createStubErrorHandler(
      new Error('Unexpected API error'),
    );
    const clearStub = sinon.stub(errorHandler, 'clear');
    const { store } = dispatchSignedInUser({});

    const root = render({ errorHandler, store });

    _addonRemovedFromCollection({ root, store });

    sinon.assert.called(clearStub);
  });

  it('calls clearTimeout when unmounting and timeout is set', () => {
    const { store } = dispatchSignedInUser({
      userId: signedInUserId,
    });
    const timeoutID = 123;
    const setTimeoutSpy = sinon.spy(() => timeoutID);
    const clearTimeoutSpy = sinon.spy();
    const root = render({
      clearTimeout: clearTimeoutSpy,
      setTimeout: setTimeoutSpy,
      store,
    });

    _addonAddedToCollection({ userId: signedInUserId, root, store });
    sinon.assert.called(setTimeoutSpy);

    root.unmount();

    sinon.assert.calledWith(clearTimeoutSpy, timeoutID);
  });

  it('does not call clearTimeout when unmounting and there is no timeout set', () => {
    const clearTimeoutSpy = sinon.spy();
    const root = render({ clearTimeout: clearTimeoutSpy });

    root.unmount();

    sinon.assert.notCalled(clearTimeoutSpy);
  });

  it('removes the notification after a new add-on has been selected', () => {
    const { store } = dispatchSignedInUser({
      userId: signedInUserId,
    });
    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(0);

    _addonAddedToCollection({ userId: signedInUserId, root, store });

    expect(root.find(Notice)).toHaveLength(1);

    const suggestion = createInternalSuggestionWithLang(
      createFakeAutocompleteResult({ name: 'uBlock Origin' }),
    );
    const selectSuggestion = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    selectSuggestion(suggestion);

    applyUIStateChanges({ root, store });
    expect(root.find(Notice)).toHaveLength(0);
  });

  describe('extractId', () => {
    it('generates an ID without a collection', () => {
      expect(extractId(getProps({ collection: null }))).toEqual('collection');
    });

    it('generates an ID with a collection', () => {
      const id = 12345;
      const collection = createInternalCollectionWithLang({
        detail: createFakeCollectionDetail({
          id,
        }),
      });
      expect(extractId(getProps({ collection }))).toEqual(`collection${id}`);
    });
  });
});
