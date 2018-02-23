import * as React from 'react';

import CollectionManager, {
  extractId, CollectionManagerBase, COLLECTION_OVERLAY,
} from 'amo/components/CollectionManager';
import {
  createInternalCollection, updateCollection,
} from 'amo/reducers/collections';
import { setLang } from 'core/actions';
import { setErrorMessage } from 'core/actions/errors';
import { stripHtmlEntities } from 'core/utils';
import {
  createFakeEvent,
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
import FormOverlay from 'ui/components/FormOverlay';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = ({
    collection = createInternalCollection({
      detail: createFakeCollectionDetail(),
    }),
    ...customProps
  }) => {
    return {
      collection,
      i18n: fakeI18n(),
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
    const form = root.find(FormOverlay);
    expect(form).toHaveProp('onCancel');
    const onCancel = form.prop('onCancel');

    // Simulate pressing the cancel button on the form.
    onCancel(createFakeEvent());
  };

  const simulateSubmit = (root) => {
    const form = root.find(FormOverlay);
    expect(form).toHaveProp('onSubmit');
    const onSubmit = form.prop('onSubmit');

    // Simulate pressing the submit button on the form.
    onSubmit(createFakeEvent());
  };

  const typeInput = ({ root, name, text }) => {
    // Look for input or textarea, etc. Example:
    // <form><input name="description' /></form>
    root.find(`[name="${name}"]`).simulate('change', createFakeEvent({
      target: { name, value: text },
    }));
  };

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
      .toHaveProp('defaultValue', collection.description);
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
      .toHaveProp('value', stripHtmlEntities(name));
    expect(root.find('#collectionDescription'))
      .toHaveProp('defaultValue', stripHtmlEntities(description));
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
      .toHaveProp('defaultValue', description);
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
      .toHaveProp('defaultValue', 'New description');
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
      formOverlayId: COLLECTION_OVERLAY,
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

  it('reports an error when the name is blank', () => {
    dispatchSignInActions({ store });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render();

    // Enter in a blank collection name.
    typeInput({ root, name: 'name', text: '' });

    dispatchSpy.reset();
    simulateSubmit(root);

    sinon.assert.calledWith(dispatchSpy, setErrorMessage({
      id: root.instance().props.errorHandler.id,
      message: 'Collection name cannot be blank',
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
      formOverlayId: COLLECTION_OVERLAY,
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
