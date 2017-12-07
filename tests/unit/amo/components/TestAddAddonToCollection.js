import React from 'react';

import AddAddonToCollection, {
  AddAddonToCollectionBase, mapStateToProps,
} from 'amo/components/AddAddonToCollection';
import {
  addAddonToCollection, fetchUserCollections, loadUserCollections,
} from 'amo/reducers/collections';
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
import LoadingText from 'ui/components/LoadingText';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      addon: createInternalAddon(fakeAddon),
      i18n: fakeI18n(),
      store,
      ...customProps,
    };
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
      root.setProps(mapStateToProps(store.getState()));

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
      const userId = 5543;
      dispatchSignInActions({ store, userId });
      store.dispatch(fetchUserCollections({
        errorHandlerId: 'some-id', userId,
      }));

      const dispatchSpy = sinon.spy(store, 'dispatch');
      render();

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

    it('lets you select a collection', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 234 });
      const authorId = 1;

      const firstCollection = createFakeCollectionDetail({
        authorId, name: 'first',
      });
      const secondCollection = createFakeCollectionDetail({
        authorId, name: 'second',
      });

      signInAndDispatchCollections({
        userId: authorId,
        collections: [firstCollection, secondCollection],
      });
      const root = render({ addon });

      const dispatchStub = sinon.stub(store, 'dispatch');

      const select = root.find('.AddAddonToCollection-select');
      const firstOption = findOption({ root, text: 'first' });

      select.simulate('change', createFakeEvent({
        target: { value: firstOption.prop('value') },
      }));

      sinon.assert.calledWith(dispatchStub, addAddonToCollection({
        errorHandlerId: root.instance().props.errorHandler.id,
        addonId: addon.id,
        collectionId: firstCollection.id,
      }));
    });
  });
});
