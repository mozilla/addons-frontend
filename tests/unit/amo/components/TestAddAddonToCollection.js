import React from 'react';

import AddAddonToCollection, {
  AddAddonToCollectionBase, mapStateToProps,
} from 'amo/components/AddAddonToCollection';
import {
  fetchUserCollections, loadUserCollections,
} from 'amo/reducers/collections';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';


describe(__filename, () => {
  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...customProps,
    };
    return shallowUntilTarget(
      <AddAddonToCollection {...props} />, AddAddonToCollectionBase
    );
  };

  it('lets you specify the css class', () => {
    const root = render({ className: 'MyClass' });

    expect(root).toHaveClassName('MyClass');
    expect(root).toHaveClassName('AddAddonToCollection');
  });

  it('fetches user collections on first render', () => {
    const userId = 5543;
    const { store } = dispatchSignInActions({ userId });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ store });

    sinon.assert.calledWith(dispatchSpy, fetchUserCollections({
      errorHandlerId: root.instance().props.errorHandler.id, userId,
    }));
  });

  it('fetches user collections on update', () => {
    const { store } = dispatchSignInActions({ userId: 1 });
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ store });
    dispatchSpy.reset();

    const userId = 2;
    dispatchSignInActions({ store, userId });
    root.setProps(mapStateToProps(store.getState()));

    sinon.assert.calledWith(dispatchSpy, fetchUserCollections({
      errorHandlerId: root.instance().props.errorHandler.id, userId,
    }));
  });

  it('does not fetch user collections when signed out', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    render({ store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetch user collections when they exist', () => {
    const userId = 5543;
    const { store } = dispatchSignInActions({ userId });
    const collections = [
      createFakeCollectionDetail({ authorId: userId })
    ];
    store.dispatch(loadUserCollections({ userId, collections }));

    const dispatchSpy = sinon.spy(store, 'dispatch');
    render({ store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetch user collections on update when they exist', () => {
    const userId = 5543;
    const { store } = dispatchSignInActions({ userId });
    const collections = [
      createFakeCollectionDetail({ authorId: userId })
    ];
    store.dispatch(loadUserCollections({ userId, collections }));

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ store });
    dispatchSpy.reset();

    // Pretend this is updating some unrelated props.
    root.setProps({});

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetch user collections while loading', () => {
    const userId = 5543;
    const { store } = dispatchSignInActions({ userId });
    const collections = [
      createFakeCollectionDetail({ authorId: userId })
    ];
    store.dispatch(fetchUserCollections({
      errorHandlerId: 'some-id', userId,
    }));

    const dispatchSpy = sinon.spy(store, 'dispatch');
    render({ store });

    sinon.assert.notCalled(dispatchSpy);
  });
});
