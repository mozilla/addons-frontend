import * as React from 'react';
/* global window */

import AutoSearchInput from 'amo/components/AutoSearchInput';
import CollectionAddAddon, {
  CollectionAddAddonBase,
  extractId,
  mapStateToProps,
  MESSAGE_RESET_TIME,
} from 'amo/components/CollectionAddAddon';
import {
  addAddonToCollection,
  addonAddedToCollection,
  createInternalCollection,
} from 'amo/reducers/collections';
import { createInternalSuggestion } from 'core/reducers/autocomplete';
import {
  applyUIStateChanges,
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
  simulateComponentCallback,
} from 'tests/unit/helpers';
import {
  createFakeAutocompleteResult,
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import ErrorList from 'ui/components/ErrorList';
import Notice from 'ui/components/Notice';

const simulateAutoSearchCallback = (props = {}) => {
  return simulateComponentCallback({
    Component: AutoSearchInput,
    ...props,
  });
};

const _addonAddedToCollection = ({ username, root, store }) => {
  store.dispatch(
    addonAddedToCollection({
      addonId: 123,
      collectionId: 321,
      username,
    }),
  );

  // Simulate a Redux state update.
  root.setProps(mapStateToProps(store.getState()));

  applyUIStateChanges({ root, store });
};

describe(__filename, () => {
  const signedInUserId = 123;
  const signedInUsername = 'user123';

  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(Date.now());
  });

  afterEach(() => {
    clock.restore();
  });

  const dispatchSignedInUser = ({
    userId = signedInUserId,
    username = signedInUsername,
  }) => {
    return dispatchSignInActions({
      userId,
      userProps: { username },
    });
  };

  const getProps = ({
    collection = createInternalCollection({
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

  it('dispatches addAddonToCollection when selecting an add-on', () => {
    const authorUsername = 'non-signed-in-user';
    const currentUsername = 'signed-in-user';

    const { store } = dispatchSignedInUser({
      username: currentUsername,
    });
    const filters = { page: 2 };
    const errorHandler = createStubErrorHandler();

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername }),
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler, filters, store });

    const suggestion = createInternalSuggestion(
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
        username: authorUsername,
      }),
    );
  });

  it('displays a notification for 5 seconds after an add-on has been added', () => {
    const { store } = dispatchSignedInUser({
      username: signedInUsername,
    });
    const root = render({ setTimeout: window.setTimeout, store });

    expect(root.find(Notice)).toHaveLength(0);

    _addonAddedToCollection({ username: signedInUsername, root, store });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice).children()).toHaveText('Added to collection');

    expect(root.instance().props.uiState.addonWasAdded).toEqual(true);

    // Trigger the setTimeout behavior.
    clock.tick(MESSAGE_RESET_TIME);

    applyUIStateChanges({ root, store });
    expect(root.instance().props.uiState.addonWasAdded).toEqual(false);
    expect(root.find(Notice)).toHaveLength(0);
  });

  it('calls clearTimeout when unmounting and timeout is set', () => {
    const { store } = dispatchSignedInUser({
      username: signedInUsername,
    });
    const timeoutID = 123;
    const setTimeoutSpy = sinon.spy(() => timeoutID);
    const clearTimeoutSpy = sinon.spy();
    const root = render({
      clearTimeout: clearTimeoutSpy,
      setTimeout: setTimeoutSpy,
      store,
    });

    _addonAddedToCollection({ username: signedInUsername, root, store });
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
      username: signedInUsername,
    });
    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(0);

    _addonAddedToCollection({ username: signedInUsername, root, store });

    expect(root.find(Notice)).toHaveLength(1);

    const suggestion = createInternalSuggestion(
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
      const collection = createInternalCollection({
        detail: createFakeCollectionDetail({
          id,
        }),
      });
      expect(extractId(getProps({ collection }))).toEqual(`collection${id}`);
    });
  });
});
