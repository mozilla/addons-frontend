import config from 'config';
import * as React from 'react';

import CollectionManager, {
  CollectionManagerBase,
  extractId,
} from 'amo/components/CollectionManager';
import {
  beginCollectionModification,
  createCollection,
  createInternalCollection,
  finishCollectionModification,
  finishEditingCollectionDetails,
  updateCollection,
} from 'amo/reducers/collections';
import { setLang } from 'core/actions';
import { CLIENT_APP_FIREFOX } from 'core/constants';
import { decodeHtmlEntities } from 'core/utils';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeHistory,
  createFakeLocation,
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  let fakeHistory;
  let store;
  const apiHost = config.get('apiHost');
  const signedInUserId = 123;
  const signedInUsername = 'user123';
  const lang = 'en-US';

  beforeEach(() => {
    fakeHistory = createFakeHistory();
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
    history = fakeHistory,
    ...customProps
  }) => {
    return {
      collection,
      creating: false,
      filters: {},
      history,
      i18n: fakeI18n(),
      location: createFakeLocation(),
      store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const { history, ...props } = getProps(customProps);

    return shallowUntilTarget(
      <CollectionManager {...props} />,
      CollectionManagerBase,
      { shallowOptions: createContextWithFakeRouter({ history }) },
    );
  };

  const simulateCancel = (root, event = createFakeEvent()) => {
    root.find('.CollectionManager-cancel').simulate('click', event);
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
      'Save changes',
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

  it('creates a collection on submit', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection: null, creating: true });

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
        errorHandlerId: root.instance().props.errorHandler.id,
        name: { [lang]: name },
        slug,
        username: signedInUsername,
      }),
    );
  });

  it('creates a collection with an add-on on submit', () => {
    const id = 123;

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({
      collection: null,
      creating: true,
      history: createFakeHistory({
        location: createFakeLocation({ query: { include_addon_id: id } }),
      }),
    });

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
        errorHandlerId: root.instance().props.errorHandler.id,
        includeAddonId: id,
        name: { [lang]: name },
        slug,
        username: signedInUsername,
      }),
    );
  });

  it('updates the collection on submit', () => {
    const filters = { page: 1 };

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername: signedInUsername }),
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, filters });

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
        errorHandlerId: root.instance().props.errorHandler.id,
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
    const name = 'Collection name';

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ name }),
    });

    const verifyButtons = ({ root, disabled }) => {
      expect(root.find('.CollectionManager-cancel')).toHaveProp(
        'disabled',
        disabled,
      );
      expect(root.find('.CollectionManager-submit')).toHaveProp(
        'disabled',
        disabled,
      );
    };

    let root = render({ collection });

    // Enter a value for name in order to enable submit button.
    typeInput({ root, name: 'name', text: `${name}-changed` });

    // Buttons should be enabled now.
    verifyButtons({ root, disabled: false });

    store.dispatch(beginCollectionModification());
    root = render({ collection });
    verifyButtons({ root, disabled: true });

    store.dispatch(finishCollectionModification());
    root = render({ collection });
    // Enter a value for name in order to enable submit button.
    typeInput({ root, name: 'name', text: `${name}-changed` });

    verifyButtons({ root, disabled: false });
  });

  it('enables and disables the submit button when form data is modified', () => {
    const description = 'Collection name description';
    const name = 'Collection name';
    const slug = 'collection-slug';

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ description, name, slug }),
    });

    const verifySaveButton = ({ root, disabled }) => {
      expect(root.find('.CollectionManager-submit')).toHaveProp(
        'disabled',
        disabled,
      );
    };

    const root = render({ collection });

    // Save should be disabled by default.
    verifySaveButton({ root, disabled: true });

    typeInput({ root, name: 'description', text: `${description}-changed` });
    verifySaveButton({ root, disabled: false });

    typeInput({ root, name: 'description', text: description });
    verifySaveButton({ root, disabled: true });

    typeInput({ root, name: 'name', text: `${name}-changed` });
    verifySaveButton({ root, disabled: false });

    typeInput({ root, name: 'name', text: name });
    verifySaveButton({ root, disabled: true });

    typeInput({ root, name: 'slug', text: `${slug}-changed` });
    verifySaveButton({ root, disabled: false });

    typeInput({ root, name: 'slug', text: slug });
    verifySaveButton({ root, disabled: true });
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

  it('dispatches finishEditingCollectionDetails on cancel when editing', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ editing: true });

    const clickEvent = createFakeEvent();
    simulateCancel(root, clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.called(clickEvent.stopPropagation);
    sinon.assert.calledWith(dispatchSpy, finishEditingCollectionDetails());
  });

  it('calls history.push() when creating and language is defined', () => {
    const siteLang = 'de';
    const clientApp = 'firefox';
    const localStore = dispatchClientMetadata({ clientApp, lang: siteLang })
      .store;

    const root = render({ creating: true, store: localStore });

    simulateCancel(root);

    sinon.assert.calledWith(
      fakeHistory.push,
      `/${siteLang}/${clientApp}/collections/`,
    );
  });

  it('calls history.goBack() when creating and language is falsey', () => {
    store.dispatch(setLang(undefined));

    const root = render({ creating: true });

    simulateCancel(root);

    sinon.assert.called(fakeHistory.goBack);
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
    expect(state.name).toEqual(secondCollection.name);
    expect(state.description).toEqual(secondCollection.description);
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
