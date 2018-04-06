import * as React from 'react';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import CollectionManager, {
  extractId, CollectionManagerBase,
} from 'amo/components/CollectionManager';
import {
  createInternalCollection, updateCollection,
} from 'amo/reducers/collections';
import { setLang } from 'core/actions';
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

const simulateAutoSearchCallback = (props = {}) => {
  return simulateComponentCallback({
    Component: AutoSearchInput, ...props,
  });
};

describe(__filename, () => {
  let fakeRouter;
  let store;

  beforeEach(() => {
    fakeRouter = createFakeRouter();
    store = dispatchClientMetadata().store;
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
      i18n: fakeI18n(),
      router,
      store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);
    return shallowUntilTarget(
      <CollectionManager {...props} />, CollectionManagerBase
    );
  };

  const simulateCancel = (root) => {
    root.find('.CollectionManager-cancel')
      .simulate('click', createFakeEvent());
  };

  const simulateSubmit = (root) => {
    // Submit the root form component.
    root.find('.CollectionManager').simulate('submit', createFakeEvent());
  };

  const typeInput = ({ root, name, text }) => {
    // Look for input or textarea, etc. Example:
    // <form><input name="description' /></form>
    root.find(`[name="${name}"]`).simulate('change', createFakeEvent({
      target: { name, value: text },
    }));
  };

  it('renders loading text before a collection has loaded', () => {
    const root = render({ collection: null });

    expect(root.find(LoadingText)).toHaveLength(2);
  });

  it('disables the form buttons before a collection has loaded', () => {
    const root = render({ collection: null });

    expect(root.find('.CollectionManager-cancel'))
      .toHaveProp('disabled', true);
    expect(root.find('.CollectionManager-submit'))
      .toHaveProp('disabled', true);
  });

  it('populates the form with collection data', () => {
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        name: 'OG name',
        description: 'OG description',
        slug: 'the-slug',
      }),
    });
    const root = render({ collection });

    expect(root.find('#collectionName'))
      .toHaveProp('value', collection.name);
    expect(root.find('#collectionDescription'))
      .toHaveProp('value', collection.description);
    expect(root.find('#collectionSlug'))
      .toHaveProp('value', collection.slug);
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

    expect(root.find('#collectionName'))
      .toHaveProp('value', decodeHtmlEntities(name));
    expect(root.find('#collectionDescription'))
      .toHaveProp('value', decodeHtmlEntities(description));
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
    expect(root.find('#collectionDescription'))
      .toHaveProp('value', description);
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

    nameInput.simulate('change', createFakeEvent({
      target: { name: 'name', value: 'New name' },
    }));
    descriptionInput.simulate('change', createFakeEvent({
      target: { name: 'description', value: 'New description' },
    }));
    slugInput.simulate('change', createFakeEvent({
      target: { name: 'slug', value: 'new-slug' },
    }));

    expect(root.find('#collectionName')).toHaveProp('value', 'New name');
    expect(root.find('#collectionDescription'))
      .toHaveProp('value', 'New description');
    expect(root.find('#collectionSlug')).toHaveProp('value', 'new-slug');
  });

  it('updates the collection on submit', () => {
    const authorUsername = 'some-user';
    const errorHandler = createStubErrorHandler();
    const lang = 'en-US';
    dispatchSignInActions({ lang, store });

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername }),
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler });

    // Fill in the form with new values.
    const name = 'A new name';
    const description = 'A new description';
    const slug = 'new-slug';

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'description', text: description });
    typeInput({ root, name: 'slug', text: slug });

    simulateSubmit(root);

    sinon.assert.calledWith(dispatchSpy, updateCollection({
      collectionSlug: collection.slug,
      defaultLocale: collection.defaultLocale,
      description: { [lang]: description },
      errorHandlerId: errorHandler.id,
      name: { [lang]: name },
      slug,
      user: authorUsername,
    }));
  });

  it('renders any error', () => {
    const errorHandler = createStubErrorHandler(
      new Error('Unexpected API error')
    );
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('disables submit button when the name is blank', () => {
    const root = render();

    // Enter in a blank collection name.
    typeInput({ root, name: 'name', text: '' });

    expect(root.find('.CollectionManager-cancel'))
      .toHaveProp('disabled', false);
    expect(root.find('.CollectionManager-submit'))
      .toHaveProp('disabled', true);
  });

  it('disables submit button when the name is spaces', () => {
    const root = render();

    // Enter in a space only collection name.
    typeInput({ root, name: 'name', text: '   ' });

    expect(root.find('.CollectionManager-cancel'))
      .toHaveProp('disabled', false);
    expect(root.find('.CollectionManager-submit'))
      .toHaveProp('disabled', true);
  });

  it('disables submit button when the slug is blank', () => {
    const root = render();

    // Enter in a blank collection slug.
    typeInput({ root, name: 'slug', text: '' });

    expect(root.find('.CollectionManager-cancel'))
      .toHaveProp('disabled', false);
    expect(root.find('.CollectionManager-submit'))
      .toHaveProp('disabled', true);
  });

  it('disables submit button when the slug is spaces', () => {
    const root = render();

    // Enter in a space only collection slug.
    typeInput({ root, name: 'slug', text: '   ' });

    expect(root.find('.CollectionManager-cancel'))
      .toHaveProp('disabled', false);
    expect(root.find('.CollectionManager-submit'))
      .toHaveProp('disabled', true);
  });

  it('trims leading and trailing spaces from slug and name before submitting', () => {
    const authorUsername = 'collection-owner';
    const name = 'trishul';
    const slug = 'trishul';
    const lang = 'en-US';
    dispatchSignInActions({ lang, store });

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername, name, slug }),
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection });

    // Enter in collection name and slug with trailing and leading spaces.
    typeInput({ root, name: 'name', text: `  ${name}   ` });
    typeInput({ root, name: 'slug', text: `  ${slug}   ` });

    dispatchSpy.reset();
    simulateSubmit(root);

    sinon.assert.calledWith(dispatchSpy, updateCollection({
      collectionSlug: slug,
      defaultLocale: collection.defaultLocale,
      description: { [lang]: collection.description },
      errorHandlerId: root.instance().props.errorHandler.id,
      name: { [lang]: name },
      slug,
      user: authorUsername,
    }));
  });

  it('allows a blank description', () => {
    const authorUsername = 'collection-owner';
    const lang = 'en-US';
    dispatchSignInActions({ lang, store });

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername }),
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection });

    // Enter in a blank collection description.
    typeInput({ root, name: 'description', text: '' });

    dispatchSpy.reset();
    simulateSubmit(root);

    sinon.assert.calledWith(dispatchSpy, updateCollection({
      collectionSlug: collection.slug,
      defaultLocale: collection.defaultLocale,
      description: { [lang]: '' },
      errorHandlerId: root.instance().props.errorHandler.id,
      name: { [lang]: collection.name },
      slug: collection.slug,
      user: authorUsername,
    }));
  });

  it('requires a collection before submitting a form', () => {
    const root = render({ collection: null });

    expect(() => simulateSubmit(root))
      .toThrow(/cannot be submitted without a collection/);
  });

  it('requires a language before submitting a form', () => {
    dispatchSignInActions({ store });
    store.dispatch(setLang(null));
    const root = render();

    expect(() => simulateSubmit(root))
      .toThrow(/cannot be submitted without a site language/);
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

  it('redirects to the detail view on cancel', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'de';
    const localStore = dispatchClientMetadata({ clientApp, lang }).store;

    const slug = 'my-collection';
    const username = 'some-username';
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        authorUsername: username, slug,
      }),
    });
    const root = render({ collection, store: localStore });

    simulateCancel(root);

    sinon.assert.calledWith(
      fakeRouter.push,
      `/${lang}/${clientApp}/collections/${username}/${slug}/`
    );
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

  it('handles searching for an add-on', () => {
    const root = render();

    const search = simulateAutoSearchCallback({
      root, propName: 'onSearch',
    });
    search({ query: 'ad blocker' });
    // TODO: test onSearch
    // https://github.com/mozilla/addons-frontend/issues/4590
  });

  it('handles selecting an add-on', () => {
    const root = render();

    const suggestion = createInternalSuggestion(
      createFakeAutocompleteResult({ name: 'uBlock Origin' })
    );
    const selectSuggestion = simulateAutoSearchCallback({
      root, propName: 'onSuggestionSelected',
    });
    selectSuggestion(suggestion);
    // TODO: test onSuggestionSelected
    // https://github.com/mozilla/addons-frontend/issues/4590
  });

  describe('extractId', () => {
    it('generates an ID without a collection', () => {
      expect(extractId(getProps({ collection: null })))
        .toEqual('collection-');
    });

    it('generates an ID with a collection', () => {
      const collection = createInternalCollection({
        detail: createFakeCollectionDetail({
          slug: 'some-slug',
        }),
      });
      expect(extractId(getProps({ collection })))
        .toEqual('collection-some-slug');
    });
  });
});
