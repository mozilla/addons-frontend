import config from 'config';
import * as React from 'react';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import CollectionManager, {
  ADDON_ADDED_STATUS_PENDING,
  ADDON_ADDED_STATUS_SUCCESS,
  CollectionManagerBase,
  extractId,
  MESSAGE_RESET_TIME,
} from 'amo/components/CollectionManager';
import {
  addAddonToCollection,
  createCollection,
  createInternalCollection,
  beginCollectionModification,
  finishCollectionModification,
  updateCollection,
} from 'amo/reducers/collections';
import { CLIENT_APP_FIREFOX } from 'core/constants';
import { createInternalSuggestion } from 'core/reducers/autocomplete';
import { decodeHtmlEntities } from 'core/utils';
import {
  createFakeEvent,
  createFakeRouter,
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
import LoadingText from 'ui/components/LoadingText';
import Notice from 'ui/components/Notice';

const simulateAutoSearchCallback = (props = {}) => {
  return simulateComponentCallback({
    Component: AutoSearchInput,
    ...props,
  });
};

describe(__filename, () => {
  let fakeRouter;
  let store;
  const apiHost = config.get('apiHost');
  const signedInUserId = 123;
  const signedInUsername = 'user123';
  const lang = 'en-US';

  beforeEach(() => {
    fakeRouter = createFakeRouter();
    store = dispatchClientMetadata().store;
    dispatchSignInActions({
      lang,
      store,
      userId: signedInUserId,
      userProps: { username: signedInUsername },
    });
  });

  const getProps = ({
    collection = createInternalCollection({
      detail: createFakeCollectionDetail(),
    }),
    router = fakeRouter,
    ...customProps
  }) => {
    return {
      collection,
      creating: false,
      filters: {},
      i18n: fakeI18n(),
      router,
      store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);
    return shallowUntilTarget(
      <CollectionManager {...props} />,
      CollectionManagerBase,
    );
  };

  const simulateCancel = (root) => {
    root.find('.CollectionManager-cancel').simulate('click', createFakeEvent());
  };

  const simulateSubmit = (root) => {
    // Submit the root form component.
    root.find('.CollectionManager').simulate('submit', createFakeEvent());
  };

  const typeInput = ({ root, name, text }) => {
    // Look for input or textarea, etc. Example:
    // <form><input name="description' /></form>
    root.find(`[name="${name}"]`).simulate(
      'change',
      createFakeEvent({
        target: { name, value: text },
      }),
    );
  };

  it('renders loading text before a collection has loaded', () => {
    const root = render({ collection: null });

    expect(root.find(LoadingText)).toHaveLength(2);
  });

  it('disables the form buttons before a collection has loaded', () => {
    const root = render({ collection: null });

    expect(root.find('.CollectionManager-cancel')).toHaveProp('disabled', true);
    expect(root.find('.CollectionManager-submit')).toHaveProp('disabled', true);
  });

  it('displays the correct button for create', () => {
    const root = render({ collection: null, creating: true });

    expect(root.find('.CollectionManager-submit').children()).toHaveText(
      'Create collection',
    );
  });

  it('displays the correct button for edit', () => {
    const root = render({ collection: null, creating: false });

    expect(root.find('.CollectionManager-submit').children()).toHaveText(
      'Save collection',
    );
  });

  it('can render an empty form for create', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const newLang = 'de';
    const username = 'testUser';
    const localStore = dispatchClientMetadata({ clientApp, lang: newLang })
      .store;
    dispatchSignInActions({
      lang: newLang,
      store: localStore,
      userProps: { username },
    });

    const root = render({
      collection: null,
      creating: true,
      store: localStore,
    });

    const expectedUrlPrefix = `${apiHost}/${newLang}/${clientApp}/collections/${username}/`;
    expect(root.find('#collectionName')).toHaveProp('value', null);
    expect(root.find('#collectionDescription')).toHaveProp('value', null);
    expect(root.find('#collectionSlug')).toHaveProp('value', null);
    expect(root.find('#collectionUrlPrefix')).toHaveProp(
      'title',
      expectedUrlPrefix,
    );
    expect(root.find('#collectionUrlPrefix')).toIncludeText(expectedUrlPrefix);
  });

  it('populates the edit form with collection data', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const newLang = 'de';
    const username = 'testUser';
    const localStore = dispatchClientMetadata({ clientApp, lang: newLang })
      .store;
    dispatchSignInActions({
      lang: newLang,
      store: localStore,
      userProps: { username },
    });
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        name: 'OG name',
        description: 'OG description',
        slug: 'the-slug',
        authorUsername: username,
      }),
    });
    const root = render({ collection, store: localStore });

    const expectedUrlPrefix = `${apiHost}/${newLang}/${clientApp}/collections/${username}/`;
    expect(root.find('#collectionName')).toHaveProp('value', collection.name);
    expect(root.find('#collectionDescription')).toHaveProp(
      'value',
      collection.description,
    );
    expect(root.find('#collectionSlug')).toHaveProp('value', collection.slug);
    expect(root.find('#collectionUrlPrefix')).toHaveProp(
      'title',
      expectedUrlPrefix,
    );
    expect(root.find('#collectionUrlPrefix')).toIncludeText(expectedUrlPrefix);
  });

  it('strips HTML entities from name and description', () => {
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        // This is how the API returns data.
        name: 'Things &amp; Stuff',
        description: 'Extensions about things &amp; stuff',
      }),
    });
    const root = render({ collection });

    const { description, name } = collection;

    expect(root.find('#collectionName')).toHaveProp(
      'value',
      decodeHtmlEntities(name),
    );
    expect(root.find('#collectionDescription')).toHaveProp(
      'value',
      decodeHtmlEntities(description),
    );
  });

  it('does not populate form when updating to the same collection', () => {
    const firstCollection = createInternalCollection({
      detail: createFakeCollectionDetail({
        id: 1,
        name: 'First name',
        description: 'First description',
        slug: 'first-slug',
      }),
    });
    const root = render({ collection: firstCollection });

    const name = 'User typed name';
    const description = 'User typed description';
    const slug = 'user-typed-slug';

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'description', text: description });
    typeInput({ root, name: 'slug', text: slug });

    // Simulate how a mounted component will get updated with the same
    // collection. E.G. This happens when pressing the submit button.
    root.setProps({ collection: firstCollection });

    // Make sure the internal state is preserved.
    expect(root.find('#collectionName')).toHaveProp('value', name);
    expect(root.find('#collectionDescription')).toHaveProp(
      'value',
      description,
    );
    expect(root.find('#collectionSlug')).toHaveProp('value', slug);
  });

  it('captures inputted text', () => {
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        name: 'OG name',
        description: 'OG description',
        slug: 'og-slug',
      }),
    });
    const root = render({ collection });

    const nameInput = root.find('#collectionName');
    const descriptionInput = root.find('#collectionDescription');
    const slugInput = root.find('#collectionSlug');

    nameInput.simulate(
      'change',
      createFakeEvent({
        target: { name: 'name', value: 'New name' },
      }),
    );
    descriptionInput.simulate(
      'change',
      createFakeEvent({
        target: { name: 'description', value: 'New description' },
      }),
    );
    slugInput.simulate(
      'change',
      createFakeEvent({
        target: { name: 'slug', value: 'new-slug' },
      }),
    );

    expect(root.find('#collectionName')).toHaveProp('value', 'New name');
    expect(root.find('#collectionDescription')).toHaveProp(
      'value',
      'New description',
    );
    expect(root.find('#collectionSlug')).toHaveProp('value', 'new-slug');
  });

  it('hides search add-on select when creating a collection', () => {
    const root = render({ collection: null, creating: true });

    expect(root.find(AutoSearchInput)).toHaveLength(0);
  });

  it('creates a collection on submit', () => {
    const errorHandler = createStubErrorHandler();

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection: null, creating: true, errorHandler });

    // Fill in the form with values.
    const name = 'A collection name';
    const description = 'A collection description';
    const slug = 'collection-slug';

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'description', text: description });
    typeInput({ root, name: 'slug', text: slug });

    simulateSubmit(root);

    sinon.assert.calledWith(
      dispatchSpy,
      createCollection({
        defaultLocale: lang,
        description: { [lang]: description },
        errorHandlerId: errorHandler.id,
        name: { [lang]: name },
        slug,
        username: signedInUsername,
      }),
    );
  });

  it('updates the collection on submit', () => {
    const errorHandler = createStubErrorHandler();
    const filters = { page: 1 };

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername: signedInUsername }),
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler, filters });

    // Fill in the form with new values.
    const name = 'A new name';
    const description = 'A new description';
    const slug = 'new-slug';

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'description', text: description });
    typeInput({ root, name: 'slug', text: slug });

    simulateSubmit(root);

    sinon.assert.calledWith(
      dispatchSpy,
      updateCollection({
        collectionSlug: collection.slug,
        defaultLocale: collection.defaultLocale,
        description: { [lang]: description },
        errorHandlerId: errorHandler.id,
        filters,
        name: { [lang]: name },
        slug,
        username: signedInUsername,
      }),
    );
  });

  it('renders any error', () => {
    const errorHandler = createStubErrorHandler(
      new Error('Unexpected API error'),
    );
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('disables submit button when the name is blank', () => {
    const root = render();

    // Enter in a blank collection name.
    typeInput({ root, name: 'name', text: '' });

    expect(root.find('.CollectionManager-cancel')).toHaveProp(
      'disabled',
      false,
    );
    expect(root.find('.CollectionManager-submit')).toHaveProp('disabled', true);
  });

  it('disables submit button when the name is spaces', () => {
    const root = render();

    // Enter in a space only collection name.
    typeInput({ root, name: 'name', text: '   ' });

    expect(root.find('.CollectionManager-cancel')).toHaveProp(
      'disabled',
      false,
    );
    expect(root.find('.CollectionManager-submit')).toHaveProp('disabled', true);
  });

  it('disables submit button when the slug is blank', () => {
    const root = render();

    // Enter in a blank collection slug.
    typeInput({ root, name: 'slug', text: '' });

    expect(root.find('.CollectionManager-cancel')).toHaveProp(
      'disabled',
      false,
    );
    expect(root.find('.CollectionManager-submit')).toHaveProp('disabled', true);
  });

  it('disables submit button when the slug is spaces', () => {
    const root = render();

    // Enter in a space only collection slug.
    typeInput({ root, name: 'slug', text: '   ' });

    expect(root.find('.CollectionManager-cancel')).toHaveProp(
      'disabled',
      false,
    );
    expect(root.find('.CollectionManager-submit')).toHaveProp('disabled', true);
  });

  it('disables and enables form buttons when modification status changes', () => {
    const renderAndCheckButtons = (shouldBeDisabled) => {
      const root = render();

      expect(root.find('.CollectionManager-cancel')).toHaveProp(
        'disabled',
        shouldBeDisabled,
      );
      expect(root.find('.CollectionManager-submit')).toHaveProp(
        'disabled',
        shouldBeDisabled,
      );
    };

    // Buttons should be enabled by default.
    renderAndCheckButtons(false);
    store.dispatch(beginCollectionModification());
    renderAndCheckButtons(true);
    store.dispatch(finishCollectionModification());
    renderAndCheckButtons(false);
  });

  it('trims leading and trailing spaces from slug and name before submitting', () => {
    const name = 'trishul';
    const slug = 'trishul';
    const errorHandler = createStubErrorHandler();
    const filters = { page: 1 };

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        authorUsername: signedInUsername,
        name,
        slug,
      }),
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler, filters });

    // Enter in collection name and slug with trailing and leading spaces.
    typeInput({ root, name: 'name', text: `  ${name}   ` });
    typeInput({ root, name: 'slug', text: `  ${slug}   ` });

    dispatchSpy.resetHistory();
    simulateSubmit(root);

    sinon.assert.calledWith(
      dispatchSpy,
      updateCollection({
        collectionSlug: slug,
        defaultLocale: collection.defaultLocale,
        description: { [lang]: collection.description },
        errorHandlerId: errorHandler.id,
        filters,
        name: { [lang]: name },
        slug,
        username: signedInUsername,
      }),
    );
  });

  it('autofills slug when name is entered while creating collection', () => {
    const name = "trishul's collection";
    const root = render({ collection: null, creating: true });

    typeInput({ root, name: 'name', text: name });

    expect(root).toHaveState('slug', 'trishul-s-collection');
  });

  it('does not autofill slug when custom slug is entered while creating collection', () => {
    const name = "trishul's collection";
    const slug = 'trishul';
    const root = render({ collection: null, creating: true });

    typeInput({ root, name: 'slug', text: slug });
    typeInput({ root, name: 'name', text: name });

    expect(root).toHaveState('slug', slug);
  });

  it('autofills slug with trimmed collection name', () => {
    const name = "trishul's collection";
    const root = render({ collection: null, creating: true });

    typeInput({ root, name: 'name', text: `  ${name}  ` });

    expect(root).toHaveState('slug', 'trishul-s-collection');
  });

  it('does not allow consecutive hyphen while autofilling slug', () => {
    const name = "trishul's   collection";
    const root = render({ collection: null, creating: true });

    typeInput({ root, name: 'name', text: `  ${name}  ` });

    expect(root).toHaveState('slug', 'trishul-s-collection');
  });

  it('does not update slug if event value is null', () => {
    const name = "trishul's collection";
    const root = render({ collection: null, creating: true });

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'slug', text: null });

    expect(root).toHaveState('slug', 'trishul-s-collection');
  });

  it('does not update slug if event value is undefined', () => {
    const name = "trishul's collection";
    const root = render({ collection: null, creating: true });

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'slug', text: undefined });

    expect(root).toHaveState('slug', 'trishul-s-collection');
  });

  it('allows a blank description', () => {
    const errorHandler = createStubErrorHandler();
    const filters = { page: 1 };
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername: signedInUsername }),
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler, filters });

    // Enter in a blank collection description.
    typeInput({ root, name: 'description', text: '' });

    dispatchSpy.resetHistory();
    simulateSubmit(root);

    sinon.assert.calledWith(
      dispatchSpy,
      updateCollection({
        collectionSlug: collection.slug,
        defaultLocale: collection.defaultLocale,
        description: { [lang]: '' },
        errorHandlerId: errorHandler.id,
        filters,
        name: { [lang]: collection.name },
        slug: collection.slug,
        username: signedInUsername,
      }),
    );
  });

  it('resets form state on cancel', () => {
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail(),
    });
    const root = render({ collection });

    typeInput({ root, name: 'name', text: 'New name' });
    typeInput({ root, name: 'description', text: 'New description' });

    simulateCancel(root);

    const state = root.state();
    expect(state.addonAddedStatus).toEqual(null);
    expect(state.name).toEqual(collection.name);
    expect(state.description).toEqual(collection.description);
  });

  it('clears any errors on cancel', () => {
    const errorHandler = createStubErrorHandler();
    const clearError = sinon.stub(errorHandler, 'clear');
    const root = render({ errorHandler });

    simulateCancel(root);

    sinon.assert.called(clearError);
  });

  it('redirects to the detail view on cancel when editing', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const newLang = 'de';
    const localStore = dispatchClientMetadata({ clientApp, lang: newLang })
      .store;

    const slug = 'my-collection';
    const username = 'some-username';
    const filters = { page: 1 };
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        authorUsername: username,
        slug,
      }),
    });
    const root = render({ collection, filters, store: localStore });

    simulateCancel(root);

    sinon.assert.calledWith(fakeRouter.push, {
      pathname: `/${newLang}/${clientApp}/collections/${username}/${slug}/`,
      query: filters,
    });
  });

  it('calls router.goBack() on cancel when creating', () => {
    const root = render({ creating: true });

    simulateCancel(root);

    sinon.assert.called(fakeRouter.goBack);
  });

  it('populates form state when updating to a new collection', () => {
    const root = render({ collection: null });

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        name: 'The name',
        description: 'The description',
      }),
    });
    root.setProps({ collection });

    const state = root.state();
    expect(state.addonAddedStatus).toEqual(null);
    expect(state.name).toEqual(collection.name);
    expect(state.description).toEqual(collection.description);
  });

  it('populates form state when switching collections', () => {
    const firstCollection = createInternalCollection({
      detail: createFakeCollectionDetail({
        id: 1,
        name: 'first name',
        description: 'first description',
      }),
    });
    const root = render({ collection: firstCollection });

    const secondCollection = createInternalCollection({
      detail: createFakeCollectionDetail({
        id: 2,
        name: 'second name',
        description: 'second description',
      }),
    });
    // This simulates when a user moves from editing one collection to
    // editing another collection.
    root.setProps({ collection: secondCollection });

    const state = root.state();
    expect(state.addonAddedStatus).toEqual(null);
    expect(state.name).toEqual(secondCollection.name);
    expect(state.description).toEqual(secondCollection.description);
  });

  it('handles searching for an add-on', () => {
    const root = render();

    const search = simulateAutoSearchCallback({
      root,
      propName: 'onSearch',
    });
    search({ query: 'ad blocker' });
    // TODO: test onSearch
    // https://github.com/mozilla/addons-frontend/issues/4590
  });

  it('dispatches addAddonToCollection when selecting an add-on', () => {
    const filters = { page: 2 };
    const errorHandler = createStubErrorHandler();

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername: signedInUsername }),
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler, filters });

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
    const root = render({});

    const state = root.state();
    expect(state.addonAddedStatus).toEqual(null);

    const suggestion = createInternalSuggestion(
      createFakeAutocompleteResult({ name: 'uBlock Origin' }),
    );
    const selectSuggestion = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    selectSuggestion(suggestion);

    const newState = root.state();
    expect(newState.addonAddedStatus).toEqual(ADDON_ADDED_STATUS_PENDING);
  });

  it('displays a notification for 5 seconds after an add-on has been added', () => {
    const setTimeoutSpy = sinon.spy();
    const root = render({ setTimeout: setTimeoutSpy });

    expect(root.find(Notice)).toHaveLength(0);

    root.setProps({ hasAddonBeenAdded: true });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice).children()).toHaveText('Added to collection');

    expect(root).toHaveState('addonAddedStatus', ADDON_ADDED_STATUS_SUCCESS);
    sinon.assert.calledWith(
      setTimeoutSpy,
      root.instance().resetMessageStatus,
      MESSAGE_RESET_TIME,
    );

    // Simulate the setTimeout behavior.
    root.instance().resetMessageStatus();
    // See: https://github.com/airbnb/enzyme/blob/enzyme%403.3.0/docs/guides/migration-from-2-to-3.md#for-mount-updates-are-sometimes-required-when-they-werent-before
    root.update();

    expect(root).toHaveState('addonAddedStatus', null);
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
    const root = render({});

    expect(root.find(Notice)).toHaveLength(0);

    // Setting this simulates an add-on having been added previously, which
    // will cause the notification to appear.
    root.setProps({ hasAddonBeenAdded: true });

    expect(root.find(Notice)).toHaveLength(1);

    const suggestion = createInternalSuggestion(
      createFakeAutocompleteResult({ name: 'uBlock Origin' }),
    );
    const selectSuggestion = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    selectSuggestion(suggestion);

    expect(root.find(Notice)).toHaveLength(0);
  });

  describe('extractId', () => {
    it('generates an ID without a collection', () => {
      expect(extractId(getProps({ collection: null }))).toEqual('collection-');
    });

    it('generates an ID with a collection', () => {
      const collection = createInternalCollection({
        detail: createFakeCollectionDetail({
          slug: 'some-slug',
        }),
      });
      expect(extractId(getProps({ collection }))).toEqual(
        'collection-some-slug',
      );
    });
  });
});
