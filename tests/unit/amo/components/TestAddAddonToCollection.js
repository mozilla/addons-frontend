import * as React from 'react';

import AddAddonToCollection, {
  extractId,
  AddAddonToCollectionBase,
  mapStateToProps,
} from 'amo/components/AddAddonToCollection';
import {
  addAddonToCollection,
  addonAddedToCollection,
  createInternalCollection,
  fetchUserCollections,
  loadUserCollections,
} from 'amo/reducers/collections';
import { CLIENT_APP_FIREFOX } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeHistory,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import Notice from 'ui/components/Notice';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = (customProps = {}) => {
    return {
      addon: createInternalAddon(fakeAddon),
      i18n: fakeI18n(),
      history: createFakeHistory(),
      store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const { history, ...props } = getProps(customProps);

    return shallowUntilTarget(
      <AddAddonToCollection {...props} />,
      AddAddonToCollectionBase,
      {
        shallowOptions: createContextWithFakeRouter({ history }),
      },
    );
  };

  const signInAndDispatchCollections = ({
    username = 'some-user',
    clientApp,
    collections = [createFakeCollectionDetail({ authorUsername: username })],
    lang,
    userId = 1,
  } = {}) => {
    dispatchSignInActions({
      clientApp,
      lang,
      store,
      userId,
      userProps: { username },
    });
    store.dispatch(loadUserCollections({ username, collections }));
  };

  const createSomeCollections = ({ username = 'some-user' } = {}) => {
    const firstCollection = createFakeCollectionDetail({
      authorUsername: username,
      name: 'first',
    });
    const secondCollection = createFakeCollectionDetail({
      authorUsername: username,
      name: 'second',
    });

    return { firstCollection, secondCollection };
  };

  describe('fetching user collections', () => {
    it('fetches user collections on first render', () => {
      const username = 'some-user';
      dispatchSignInActions({ store, userProps: { username } });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render();

      sinon.assert.calledWith(
        dispatchSpy,
        fetchUserCollections({
          errorHandlerId: root.instance().props.errorHandler.id,
          username,
        }),
      );
    });

    it('fetches user collections on update', () => {
      dispatchSignInActions({ store, userProps: { username: 'user-one' } });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render();
      dispatchSpy.resetHistory();

      const username = 'user-two';
      dispatchSignInActions({ store, userProps: { username } });
      root.setProps(mapStateToProps(store.getState(), {}));

      sinon.assert.calledWith(
        dispatchSpy,
        fetchUserCollections({
          errorHandlerId: root.instance().props.errorHandler.id,
          username,
        }),
      );
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
      dispatchSpy.resetHistory();

      // Pretend this is updating some unrelated props.
      root.setProps({});

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not fetch user collections while loading', () => {
      const addon = createInternalAddon(fakeAddon);
      const username = 'some-user';
      dispatchSignInActions({ store, userProps: { username } });
      store.dispatch(
        fetchUserCollections({
          errorHandlerId: 'some-id',
          username,
        }),
      );

      const dispatchSpy = sinon.spy(store, 'dispatch');
      render({ addon });

      sinon.assert.notCalled(dispatchSpy);
    });
  });

  describe('selecting a user collection', () => {
    const findOption = ({ root, text }) => {
      const option = root
        .find('.AddAddonToCollection-option')
        .filterWhere((opt) => opt.text() === text);
      expect(option).toHaveLength(1);
      return option;
    };

    it('renders a disabled select when loading user collections', () => {
      const username = 'some-user';
      dispatchSignInActions({ store, userProps: { username } });
      store.dispatch(
        fetchUserCollections({
          errorHandlerId: 'some-id',
          username,
        }),
      );

      const root = render();

      const select = root.find('.AddAddonToCollection-select');
      expect(select).toHaveProp('disabled', true);
      expect(select.html()).toContain('Loading…');
    });

    it('renders a disabled select when adding add-on to collection', () => {
      const addon = createInternalAddon(fakeAddon);
      const username = 'some-user';
      dispatchSignInActions({ store, userProps: { username } });
      store.dispatch(
        addAddonToCollection({
          addonId: addon.id,
          username,
          collectionId: 321,
          slug: 'some-collection',
          errorHandlerId: 'error-handler',
        }),
      );

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
      const username = 'some-user';

      const { firstCollection, secondCollection } = createSomeCollections({
        username,
      });

      signInAndDispatchCollections({
        username,
        collections: [firstCollection, secondCollection],
      });
      const dispatchStub = sinon.stub(store, 'dispatch');
      const root = render({ addon });

      const select = root.find('.AddAddonToCollection-select');
      const secondOption = findOption({
        root,
        text: secondCollection.name,
      });

      // Add the add-on to the second collection.
      select.simulate(
        'change',
        createFakeEvent({
          target: { value: secondOption.prop('value') },
        }),
      );

      sinon.assert.calledWith(
        dispatchStub,
        addAddonToCollection({
          errorHandlerId: root.instance().props.errorHandler.id,
          addonId: addon.id,
          collectionId: secondCollection.id,
          slug: secondCollection.slug,
          username,
        }),
      );
    });

    it('sorts collection by name in select box', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 234 });
      const username = 'some-user';

      const { firstCollection, secondCollection } = createSomeCollections({
        username,
      });

      // inserting secondCollection first in array
      signInAndDispatchCollections({
        username,
        collections: [secondCollection, firstCollection],
      });

      const root = render({ addon });
      const option = root.find('optgroup .AddAddonToCollection-option').at(0);

      expect(option).toHaveText(firstCollection.name);
    });

    it('shows a notice that you added to a collection', () => {
      const addon = createInternalAddon(fakeAddon);
      const username = 'some-user';

      const { firstCollection } = createSomeCollections({ username });

      signInAndDispatchCollections({
        username,
        collections: [firstCollection],
      });
      store.dispatch(
        addonAddedToCollection({
          addonId: addon.id,
          username,
          collectionId: firstCollection.id,
        }),
      );

      const root = render({ addon });

      const notice = root.find(Notice);
      expect(notice.prop('type')).toEqual('success');
      expect(notice.childAt(0).text()).toContain(
        `Added to ${firstCollection.name}`,
      );
    });

    it('shows notices for each target collection', () => {
      const addon = createInternalAddon(fakeAddon);
      const username = 'some-user';

      const { firstCollection, secondCollection } = createSomeCollections({
        username,
      });

      signInAndDispatchCollections({
        username,
        collections: [firstCollection, secondCollection],
      });

      const addParams = { addonId: addon.id, username };

      // Add the add-on to both collections.
      store.dispatch(
        addonAddedToCollection({
          ...addParams,
          collectionId: firstCollection.id,
        }),
      );

      store.dispatch(
        addonAddedToCollection({
          ...addParams,
          collectionId: secondCollection.id,
        }),
      );

      const root = render({ addon });

      const notice = root.find(Notice);
      const text = (index) => {
        return notice
          .at(index)
          .childAt(0)
          .text();
      };
      expect(text(0)).toContain(`Added to ${firstCollection.name}`);
      expect(text(1)).toContain(`Added to ${secondCollection.name}`);
    });

    it('does nothing when you select the prompt', () => {
      signInAndDispatchCollections();

      const dispatchStub = sinon.stub(store, 'dispatch');
      const root = render();

      const select = root.find('.AddAddonToCollection-select');
      const promptOption = findOption({
        root,
        text: 'Select a collection…',
      });

      // Select the prompt (first option) which doesn't do anything.
      select.simulate(
        'change',
        createFakeEvent({
          target: { value: promptOption.prop('value') },
        }),
      );

      sinon.assert.notCalled(dispatchStub);
    });

    it('lets you create a new collection by navigating to the collection page', () => {
      const clientApp = CLIENT_APP_FIREFOX;
      const lang = 'fr';
      const id = 234;

      const addon = createInternalAddon({ ...fakeAddon, id });

      signInAndDispatchCollections({
        clientApp,
        lang,
      });

      const historySpy = createFakeHistory();
      const root = render({ addon, history: historySpy });

      const select = root.find('.AddAddonToCollection-select');
      const createOption = findOption({
        root,
        text: 'Create new collection',
      });

      select.simulate(
        'change',
        createFakeEvent({
          target: { value: createOption.prop('value') },
        }),
      );

      sinon.assert.calledWith(
        historySpy.push,
        `/${lang}/${clientApp}/collections/add/?include_addon_id=${id}`,
      );
    });

    it('requires an add-on before you can add to a collection', () => {
      signInAndDispatchCollections();
      const root = render({ addon: null });

      const collection = createInternalCollection({
        detail: createFakeCollectionDetail(),
      });
      // This should not be possible through the UI.
      expect(() => root.instance().addToCollection(collection)).toThrow(
        /no add-on has been loaded/,
      );
    });

    it('requires you to sign in before adding to a collection', () => {
      const root = render();

      const collection = createInternalCollection({
        detail: createFakeCollectionDetail(),
      });
      // This should not be possible through the UI.
      expect(() => root.instance().addToCollection(collection)).toThrow(
        /you are not signed in/,
      );
    });
  });

  describe('error handling', () => {
    const createFailedErrorHandler = () => {
      const error = new Error('unexpected error');
      const errorHandler = new ErrorHandler({
        dispatch: store.dispatch,
        id: 'some-error-handler',
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

    it('renders an ID without an add-on or user', () => {
      expect(extractId(_props({ addon: null }))).toEqual('-');
    });

    it('renders an ID with an add-on ID and user', () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 5432 });
      const username = 'some-user';
      dispatchSignInActions({ store, userProps: { username } });
      expect(extractId(_props({ addon }))).toEqual(`${addon.id}-${username}`);
    });
  });
});
