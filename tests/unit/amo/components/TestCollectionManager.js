import * as React from 'react';

import CollectionManager, {
  extractId, CollectionManagerBase, COLLECTION_OVERLAY,
} from 'amo/components/CollectionManager';
import {
  createInternalCollection, updateCollection,
} from 'amo/reducers/collections';
import { logOutUser } from 'amo/reducers/users';
import { setLang } from 'core/actions';
import { setErrorMessage } from 'core/actions/errors';
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
      }),
    });
    const root = render({ collection });

    expect(root.find('#collectionName'))
      .toHaveProp('value', collection.name);
    expect(root.find('#collectionDescription'))
      .toHaveProp('defaultValue', collection.description);
  });

  it('does not populate form when updating to the same collection', () => {
    const firstCollection = createInternalCollection({
      detail: createFakeCollectionDetail({
        id: 1,
        name: 'First name',
        description: 'First description',
      }),
    });
    const root = render({ collection: firstCollection });

    const name = 'User typed name';
    const description = 'User typed description';

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'description', text: description });

    // Simulate how a mounted component will get updated with the same
    // collection. E.G. This happens when pressing the submit button.
    root.setProps({ collection: firstCollection });

    // Make sure the internal state is preserved.
    expect(root.find('#collectionName')).toHaveProp('value', name);
    expect(root.find('#collectionDescription'))
      .toHaveProp('defaultValue', description);
  });

  it('captures inputted text', () => {
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({
        name: 'OG name',
        description: 'OG description',
      }),
    });
    const root = render({ collection });

    const nameInput = root.find('#collectionName');
    const descriptionInput = root.find('#collectionDescription');

    nameInput.simulate('change', createFakeEvent({
      target: { name: 'name', value: 'New name' },
    }));
    descriptionInput.simulate('change', createFakeEvent({
      target: { name: 'description', value: 'New description' },
    }));

    expect(root.find('#collectionName')).toHaveProp('value', 'New name');
    expect(root.find('#collectionDescription'))
      .toHaveProp('defaultValue', 'New description');
  });

  it('updates the collection on submit', () => {
    const errorHandler = createStubErrorHandler();
    const lang = 'en-US';
    const userId = 54321;
    dispatchSignInActions({ lang, store, userId });

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail(),
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection, errorHandler });

    // Enter a new name and description.
    const name = 'A new name';
    const description = 'A new description';

    typeInput({ root, name: 'name', text: name });
    typeInput({ root, name: 'description', text: description });

    simulateSubmit(root);

    sinon.assert.calledWith(dispatchSpy, updateCollection({
      collectionSlug: collection.slug,
      description: { [lang]: description },
      errorHandlerId: errorHandler.id,
      formOverlayId: COLLECTION_OVERLAY,
      name: { [lang]: name },
      user: userId,
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
    const lang = 'en-US';
    const userId = 54321;
    dispatchSignInActions({ lang, store, userId });

    const collection = createInternalCollection({
      detail: createFakeCollectionDetail(),
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ collection });

    // Enter in a blank collection description.
    typeInput({ root, name: 'description', text: '' });

    dispatchSpy.reset();
    simulateSubmit(root);

    sinon.assert.calledWith(dispatchSpy, updateCollection({
      collectionSlug: collection.slug,
      description: { [lang]: '' },
      errorHandlerId: root.instance().props.errorHandler.id,
      formOverlayId: COLLECTION_OVERLAY,
      name: { [lang]: collection.name },
      user: userId,
    }));
  });

  it('requires a collection before submitting a form', () => {
    const root = render({ collection: null });

    expect(() => simulateSubmit(root))
      .toThrow(/cannot be submitted without a collection/);
  });

  it('requires a user before submitting a form', () => {
    store.dispatch(logOutUser());
    const root = render();

    expect(() => simulateSubmit(root))
      .toThrow(/cannot be submitted without a user/);
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
