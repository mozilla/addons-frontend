import React from 'react';

import AddAddonToCollection, {
  extractId, AddAddonToCollectionBase, mapStateToProps,
} from 'amo/components/AddAddonToCollection';
import {
  addAddonToCollection,
  addonAddedToCollection,
  createInternalCollection,
  fetchUserCollections,
  loadUserCollections,
} from 'amo/reducers/collections';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = (customProps = {}) => {
    return {
      addon: createInternalAddon(fakeAddon),
      i18n: fakeI18n(),
      store,
      _window: {},
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);
    return shallowUntilTarget(
      <AddAddonToCollection {...props} />, AddAddonToCollectionBase
    );
  };

  const signInAndDispatchCollections = ({
    userId = 1,
    collections = [
      createFakeCollectionDetail({ authorId: userId }),
    ],
  } = {}) => {
    dispatchSignInActions({ store, userId });
    store.dispatch(loadUserCollections({ userId, collections }));
  };

  const createSomeCollections = ({ authorId = 1 } = {}) => {
    const firstCollection = createFakeCollectionDetail({
      authorId, name: 'first',
    });
    const secondCollection = createFakeCollectionDetail({
      authorId, name: 'second',
    });

    return { firstCollection, secondCollection };
  };

  it('lets you specify the css class', () => {
    const root = render({ className: 'MyClass' });

    expect(root).toHaveClassName('MyClass');
    expect(root).toHaveClassName('AddAddonToCollection');
  });

  describe('fetching user collections', () => {
    it('fetches user collections on first render', () => {
      const userId = 5543;
      dispatchSignInActions({ store, userId });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render();

      sinon.assert.calledWith(dispatchSpy, fetchUserCollections({
        errorHandlerId: root.instance().props.errorHandler.id, userId,
      }));
    });

    it('fetches user collections on update', () => {
      dispatchSignInActions({ store, userId: 1 });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render();
      dispatchSpy.reset();

      const userId = 2;
      dispatchSignInActions({ store, userId });
      root.setProps(mapStateToProps(store.getState(), {}));

      sinon.assert.calledWith(dispatchSpy, fetchUserCollections({
        errorHandlerId: root.instance().props.errorHandler.id, userId,
      }));
    });

    it('does not fetch user collections when signed out', () => {
      dispatchClientMetadata({ store });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      render();

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not fetch collections on first render if they exist', () => {
      signInAndDispatchCollections();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      render();

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not fetch collections on update if they exist', () => {
      signInAndDispatchCollections();

      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render();
      dispatchSpy.reset();

      // Pretend this is updating some unrelated props.
      root.setProps({});

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not fetch user collections while loading', () => {
      const addon = createInternalAddon(fakeAddon);
      const userId = 5543;
      dispatchSignInActions({ store, userId });
      store.dispatch(fetchUserCollections({
        errorHandlerId: 'some-id', userId,
      }));

      const dispatchSpy = sinon.spy(store, 'dispatch');
      render({ addon });

      sinon.assert.notCalled(dispatchSpy);
    });
  });

  describe('selecting a user collection', () => {
    const findOption = ({ root, text }) => {
      const option = root.find('.AddAddonToCollection-option')
        .filterWhere((opt) => opt.text() === text);
      expect(option).toHaveLength(1);
      return option;
    };

    it('renders a disabled select when loading user collections', () => {
      const userId = 5543;
      dispatchSignInActions({ store, userId });
      store.dispatch(fetchUserCollections({
        errorHandlerId: 'some-id', userId,
      }));

      const root = render();

      const select = root.find('.AddAddonToCollection-select');
      expect(select).toHaveProp('disabled', true);
      expect(select.html()).toContain('Loading…');
    });

    it('renders a disabled select when adding add-on to collection', () => {
      const addon = createInternalAddon(fakeAddon);
      const userId = 5543;
      dispatchSignInActions({ store, userId });
      store.dispatch(addAddonToCollection({
        addonId: addon.id,
        userId,
        collectionId: 321,
        collectionSlug: 'some-collection',
        errorHandlerId: 'error-handler',
      }));

      const root = render({ addon });

      const select = root.find('.AddAddonToCollection-select');
      expect(select).toHaveProp('disabled', true);
      expect(select.html()).toContain('Adding…');
    });

    it('does not render collection optgroup without collections', () => {
      dispatchSignInActions({ store });
      const root = render();

      expect(root.find('optgroup')).toHaveLength(0);
    });

    it('lets you select a collection', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 234 });
      const authorId = 1;

      const { firstCollection, secondCollection } =
        createSomeCollections({ authorId });

      signInAndDispatchCollections({
        userId: authorId,
        collections: [firstCollection, secondCollection],
      });
      const dispatchStub = sinon.stub(store, 'dispatch');
      const root = render({ addon });

      const select = root.find('.AddAddonToCollection-select');
      const secondOption = findOption({
        root, text: secondCollection.name,
      });

      // Add the add-on to the second collection.
      select.simulate('change', createFakeEvent({
        target: { value: secondOption.prop('value') },
      }));

      sinon.assert.calledWith(dispatchStub, addAddonToCollection({
        errorHandlerId: root.instance().props.errorHandler.id,
        addonId: addon.id,
        collectionId: secondCollection.id,
        collectionSlug: secondCollection.slug,
        userId: authorId,
      }));
    });

    it('shows a notice that you added to a collection', () => {
      const addon = createInternalAddon(fakeAddon);
      const authorId = 1;

      const { firstCollection } = createSomeCollections({ authorId });

      signInAndDispatchCollections({
        userId: authorId, collections: [firstCollection],
      });
      store.dispatch(addonAddedToCollection({
        addonId: addon.id,
        userId: authorId,
        collectionId: firstCollection.id,
      }));

      const root = render({ addon });

      const notice = root.find('Notice');
      expect(notice.prop('type')).toEqual('success');
      expect(notice.html()).toContain(`Added to ${firstCollection.name}`);
    });

    it('shows notices for each target collection', () => {
      const addon = createInternalAddon(fakeAddon);
      const authorId = 1;

      const { firstCollection, secondCollection } =
        createSomeCollections({ authorId });

      signInAndDispatchCollections({
        userId: authorId,
        collections: [firstCollection, secondCollection],
      });

      const addParams = { addonId: addon.id, userId: authorId };

      // Add the add-on to both collections.
      store.dispatch(addonAddedToCollection({
        ...addParams, collectionId: firstCollection.id,
      }));

      store.dispatch(addonAddedToCollection({
        ...addParams, collectionId: secondCollection.id,
      }));

      const root = render({ addon });

      const notice = root.find('Notice');
      expect(notice.at(0).html())
        .toContain(`Added to ${firstCollection.name}`);
      expect(notice.at(1).html())
        .toContain(`Added to ${secondCollection.name}`);
    });

    it('disables the select the prompt', () => {
      signInAndDispatchCollections();

      const dispatchStub = sinon.stub(store, 'dispatch');
      const root = render();

      const select = root.find('.AddAddonToCollection-select');
      const promptOption = findOption({
        root, text: 'Select a collection…',
      });
      expect(promptOption).toHaveProp('disabled', true);

      // Try selecting the prompt (the first option) which shouldn't
      // do anything. This is to make sure the event handler correctly
      // ignores the event.
      select.simulate('change', createFakeEvent({
        target: { value: promptOption.prop('value') },
      }));

      sinon.assert.notCalled(dispatchStub);
    });

    it('lets you create a new collection', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 234 });
      signInAndDispatchCollections();

      const _window = { location: null };
      const root = render({ addon, _window });

      const select = root.find('.AddAddonToCollection-select');
      const createOption = findOption({
        root, text: 'Create new collection',
      });

      select.simulate('change', createFakeEvent({
        target: { value: createOption.prop('value') },
      }));

      expect(_window.location).toEqual('/collections/add');
    });

    it('requires an add-on before you can add to a collection', () => {
      signInAndDispatchCollections();
      const root = render({ addon: null });

      const collection = createInternalCollection({
        detail: createFakeCollectionDetail(),
      });
      // This should not be possible through the UI.
      expect(() => root.instance().addToCollection(collection))
        .toThrow(/no add-on has been loaded/);
    });

    it('requires you to sign in before adding to a collection', () => {
      const root = render();

      const collection = createInternalCollection({
        detail: createFakeCollectionDetail(),
      });
      // This should not be possible through the UI.
      expect(() => root.instance().addToCollection(collection))
        .toThrow(/you are not signed in/);
    });
  });

  describe('error handling', () => {
    const createFailedErrorHandler = () => {
      const error = new Error('unexpected error');
      const errorHandler = new ErrorHandler({
        dispatch: store.dispatch, id: 'some-error-handler',
      });
      errorHandler.handle(error);
      return errorHandler;
    };

    it('renders an error', () => {
      const root = render({ errorHandler: createFailedErrorHandler() });

      expect(root.find(ErrorList)).toHaveLength(1);
    });

    it('does not load data when there is an error', () => {
      dispatchSignInActions({ store });
      const errorHandler = createFailedErrorHandler();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      render({ errorHandler });

      sinon.assert.notCalled(dispatchSpy);
    });
  });

  describe('extractId', () => {
    const _props = (customProps = {}) => {
      return {
        ...getProps(customProps),
        ...mapStateToProps(store.getState(), {}),
      };
    };

    it('renders an ID without an add-on or user ID', () => {
      expect(extractId(_props({ addon: null }))).toEqual('-');
    });

    it('renders an ID with an add-on ID and user ID', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 5432 });
      const userId = 1234;
      dispatchSignInActions({ store, userId });
      expect(extractId(_props({ addon })))
        .toEqual(`${addon.id}-${userId}`);
    });
  });
});
