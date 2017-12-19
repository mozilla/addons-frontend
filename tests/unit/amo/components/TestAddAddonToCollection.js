import React from 'react';

import AddAddonToCollection, {
  extractId, AddAddonToCollectionBase, mapStateToProps,
} from 'amo/components/AddAddonToCollection';
import {
  addAddonToCollection,
  createInternalCollection,
  fetchUserAddonCollections,
  fetchUserCollections,
  loadUserAddonCollections,
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

  const dispatchAddonIsNotInAnyCollection = ({ userId, addonId }) => {
    // This loads an empty collection set for the add-on, meaning the
    // add-on is not currently in any of the user's collections.
    store.dispatch(loadUserAddonCollections({
      addonId, userId, collections: [],
    }));
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

  const signInAndInitializeAllData = ({
    addon, userId = 1,
  }) => {
    signInAndDispatchCollections({ userId });
    dispatchAddonIsNotInAnyCollection({ userId, addonId: addon.id });
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
      const addon = createInternalAddon(fakeAddon);
      signInAndInitializeAllData({ addon });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      render({ addon });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not fetch collections on update if they exist', () => {
      const addon = createInternalAddon(fakeAddon);
      signInAndInitializeAllData({ addon });

      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render({ addon });
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
      dispatchAddonIsNotInAnyCollection({ userId, addonId: addon.id });

      const dispatchSpy = sinon.spy(store, 'dispatch');
      render({ addon });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('fetches user add-on collections on first render', () => {
      const userId = 5543;
      const addon = createInternalAddon({ ...fakeAddon, id: 321 });
      signInAndDispatchCollections({ userId });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render({ addon });

      sinon.assert.calledWith(dispatchSpy, fetchUserAddonCollections({
        addonId: addon.id,
        userId,
        errorHandlerId: root.instance().props.errorHandler.id,
      }));
    });

    it('does not fetch user add-on collections while loading', () => {
      const userId = 5543;
      const addon = createInternalAddon({ ...fakeAddon, id: 321 });
      signInAndDispatchCollections({ userId });
      store.dispatch(fetchUserAddonCollections({
        addonId: addon.id, errorHandlerId: 'some-id', userId,
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

      expect(root.find('.AddAddonToCollection-select').props().disabled)
        .toEqual(true);
    });

    it('renders a disabled select when loading add-on collections', () => {
      const addon = createInternalAddon(fakeAddon);
      const userId = 5543;
      dispatchSignInActions({ store, userId });
      store.dispatch(fetchUserAddonCollections({
        addonId: addon.id, errorHandlerId: 'some-id', userId,
      }));

      const root = render({ addon });

      expect(root.find('.AddAddonToCollection-select').props().disabled)
        .toEqual(true);
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
        collectionSlug: secondCollection.slug,
        userId: authorId,
      }));
    });

    it('does nothing when you select the prompt', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 234 });
      signInAndInitializeAllData({ addon });

      const dispatchStub = sinon.stub(store, 'dispatch');
      const root = render({ addon });

      const select = root.find('.AddAddonToCollection-select');
      const promptOption = findOption({
        root, text: 'Add to collection',
      });

      // Select the prompt (first option) which doesn't do anything.
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

    it('indicates when an add-on is already in a collection', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 234 });
      const authorId = 1;

      const { firstCollection, secondCollection } =
        createSomeCollections({ authorId });

      signInAndDispatchCollections({
        userId: authorId,
        collections: [firstCollection, secondCollection],
      });
      store.dispatch(loadUserAddonCollections({
        addonId: addon.id,
        // This add-on has already been added to the second collection.
        collections: [secondCollection],
        userId: authorId,
      }));
      const root = render({ addon });

      const select = root.find('.AddAddonToCollection-select');
      // Check the pre-selected value.
      const selectedValue = select.props().value;
      expect(selectedValue).toContain(secondCollection.id);

      // The selected option should be excluded from all other options.
      const otherOptions = root.find('.AddAddonToCollection-option')
        .filterWhere((node) => node.props().value !== selectedValue);
      expect(otherOptions.map((node) => node.html()).join('\n'))
        .not.toContain(secondCollection.name);
    });

    it('indicates when an add-on is in multiple collections', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 234 });
      const authorId = 1;

      const { firstCollection, secondCollection } =
        createSomeCollections({ authorId });

      signInAndDispatchCollections({
        userId: authorId,
        collections: [firstCollection, secondCollection],
      });
      store.dispatch(loadUserAddonCollections({
        addonId: addon.id,
        // This add-on has already been added to both collections.
        collections: [firstCollection, secondCollection],
        userId: authorId,
      }));
      const root = render({ addon });

      const select = root.find('.AddAddonToCollection-select');
      const selectedValue = select.props().value;

      const option = root.find('.AddAddonToCollection-option')
        .filterWhere((node) => node.props().value === selectedValue)
        .html();
      expect(option).toContain(firstCollection.name);
      expect(option).toContain(secondCollection.name);
    });
  });

  describe('error handling', () => {
    it('renders an error', () => {
      const error = new Error('unexpected error');
      const errorHandler = new ErrorHandler({
        dispatch: store.dispatch, id: 'some-error-handler',
      });
      errorHandler.handle(error);
      const root = render({ errorHandler });

      expect(root.find(ErrorList)).toHaveLength(1);
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
