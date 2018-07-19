import * as React from 'react';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import CollectionAddAddon, {
  ADDON_ADDED_STATUS_NONE,
  ADDON_ADDED_STATUS_PENDING,
  ADDON_ADDED_STATUS_SUCCESS,
  CollectionAddAddonBase,
  extractId,
  MESSAGE_RESET_TIME,
} from 'amo/components/CollectionAddAddon';
import {
  addAddonToCollection,
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

describe(__filename, () => {
  const signedInUserId = 123;
  const signedInUsername = 'user123';

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
    const { store } = dispatchSignInActions({
      userId: signedInUserId,
      userProps: { username: signedInUsername },
    });
    const filters = { page: 2 };
    const errorHandler = createStubErrorHandler();

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername: signedInUsername }),
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
        username: signedInUsername,
      }),
    );
  });

  it('sets the addonAddedStatus state to pending when selecting an add-on', () => {
    const { store } = dispatchSignInActions();
    const root = render({ store });

    expect(root.instance().props.uiState.addonAddedStatus).toEqual(
      ADDON_ADDED_STATUS_NONE,
    );

    const suggestion = createInternalSuggestion(
      createFakeAutocompleteResult({ name: 'uBlock Origin' }),
    );
    const selectSuggestion = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    selectSuggestion(suggestion);

    applyUIStateChanges({ root, store });
    expect(root.instance().props.uiState.addonAddedStatus).toEqual(
      ADDON_ADDED_STATUS_PENDING,
    );
  });

  it('displays a notification for 5 seconds after an add-on has been added', () => {
    const { store } = dispatchSignInActions();
    const setTimeoutSpy = sinon.spy();
    const root = render({ setTimeout: setTimeoutSpy, store });

    expect(root.find(Notice)).toHaveLength(0);

    root.setProps({ hasAddonBeenAdded: true });
    applyUIStateChanges({ root, store });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice).children()).toHaveText('Added to collection');

    expect(root.instance().props.uiState.addonAddedStatus).toEqual(
      ADDON_ADDED_STATUS_SUCCESS,
    );
    sinon.assert.calledWith(
      setTimeoutSpy,
      root.instance().resetMessageStatus,
      MESSAGE_RESET_TIME,
    );

    // Simulate the setTimeout behavior.
    root.instance().resetMessageStatus();
    // See: https://github.com/airbnb/enzyme/blob/enzyme%403.3.0/docs/guides/migration-from-2-to-3.md#for-mount-updates-are-sometimes-required-when-they-werent-before
    root.update();

    applyUIStateChanges({ root, store });
    expect(root.instance().props.uiState.addonAddedStatus).toEqual(
      ADDON_ADDED_STATUS_NONE,
    );
    expect(root.find(Notice)).toHaveLength(0);
  });

  it('calls clearTimeout when unmounting and timeout is set', () => {
    const clearTimeoutSpy = sinon.spy();
    const root = render({ clearTimeout: clearTimeoutSpy });

    const timeoutID = 123;
    // Simulates the setTimeout behavior in which timeout is set.
    root.instance().timeout = timeoutID;

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
    const { store } = dispatchSignInActions();
    const root = render({ store });

    expect(root.find(Notice)).toHaveLength(0);

    // Setting this simulates an add-on having been added previously, which
    // will cause the notification to appear.
    root.setProps({ hasAddonBeenAdded: true });
    applyUIStateChanges({ root, store });

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
      expect(extractId(getProps({ collection: null }))).toEqual('');
    });

    it('generates an ID with a collection', () => {
      const collection = createInternalCollection({
        detail: createFakeCollectionDetail({
          slug: 'some-slug',
        }),
      });
      expect(extractId(getProps({ collection }))).toEqual('some-slug');
    });
  });
});
