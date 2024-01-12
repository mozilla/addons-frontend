import * as React from 'react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddAddonToCollection, {
  extractId,
} from 'amo/components/AddAddonToCollection';
import { setClientApp } from 'amo/reducers/api';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { ErrorHandler } from 'amo/errorHandler';
import {
  FETCH_USER_COLLECTIONS,
  addAddonToCollection,
  collectionName,
  fetchUserCollections,
  loadUserCollections,
} from 'amo/reducers/collections';
import collectionsSaga from 'amo/sagas/collections';
import {
  DEFAULT_LANG_IN_TESTS,
  createFakeCollectionDetail,
  createHistory,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  dispatchClientMetadataWithSagas,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

// By allowing sagas to run for some tests, we will be calling the mocked
// versions of these API methods.
// createCollectionAddon is used in a couple of tests, for when a user
// selects a collection from the drop-down.
// getAllUserCollections is mocked to throw an error to test the
// error handling in the component.
jest.mock('amo/api/collections', () => {
  return {
    createCollectionAddon: jest.fn(),
    getAllUserCollections: jest.fn().mockImplementation(() => {
      throw new Error();
    }),
  };
});

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = (customProps = {}) => {
    return {
      addon: createInternalAddonWithLang(fakeAddon),
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const { history, ...props } = getProps(customProps);

    return defaultRender(<AddAddonToCollection {...props} />, {
      history,
      store,
    });
  };

  const signInAndDispatchCollections = ({
    clientApp,
    userId = 1,
    collections = [createFakeCollectionDetail({ authorId: userId })],
    lang,
  } = {}) => {
    dispatchSignInActions({
      clientApp,
      lang,
      store,
      userId,
    });
    store.dispatch(loadUserCollections({ userId, collections }));
  };

  const createSomeCollections = ({
    firstName = 'first',
    secondName = 'second',
    userId = 123,
  } = {}) => {
    const firstCollection = createFakeCollectionDetail({
      authorId: userId,
      name: firstName,
    });
    const secondCollection = createFakeCollectionDetail({
      authorId: userId,
      name: secondName,
    });

    return { firstCollection, secondCollection };
  };

  const createErrorHandlerId = ({ addon = null, userId = null }) => {
    return `src/amo/components/AddAddonToCollection/index.js-${extractId({
      addon,
      currentUserId: userId,
    })}`;
  };

  const createStoreWithSaga = () =>
    dispatchClientMetadataWithSagas({
      sagas: [collectionsSaga],
    }).store;

  describe('fetching user collections', () => {
    it('fetches user collections on first render', () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const userId = 345;
      dispatchSignInActions({ store, userId });
      const dispatch = jest.spyOn(store, 'dispatch');

      render({ addon });

      expect(dispatch).toHaveBeenCalledWith(
        fetchUserCollections({
          errorHandlerId: createErrorHandlerId({ addon, userId }),
          userId,
        }),
      );
    });

    it('fetches user collections on update', async () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      dispatchSignInActions({ store, userId: 10 });
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ addon });
      dispatch.mockClear();

      const userId = 20;
      dispatchSignInActions({ store, userId });

      await waitFor(() =>
        expect(dispatch).toHaveBeenCalledWith(
          fetchUserCollections({
            errorHandlerId: createErrorHandlerId({ addon, userId }),
            userId,
          }),
        ),
      );
    });

    it('does not fetch user collections when signed out', () => {
      dispatchClientMetadata({ store });
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ 'type': FETCH_USER_COLLECTIONS }),
      );
    });

    it('does not fetch collections on first render if they exist', () => {
      signInAndDispatchCollections();
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ 'type': FETCH_USER_COLLECTIONS }),
      );
    });

    it('does not fetch collections on update if they exist', () => {
      signInAndDispatchCollections();
      const dispatch = jest.spyOn(store, 'dispatch');
      render();
      dispatch.mockClear();

      // Force an update via an unrelated prop.
      const { api } = store.getState();
      store.dispatch(setClientApp(api.clientApp));

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ 'type': FETCH_USER_COLLECTIONS }),
      );
    });

    it('does not fetch user collections while loading', () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const userId = 10;
      dispatchSignInActions({ store, userId });
      store.dispatch(
        fetchUserCollections({
          errorHandlerId: 'some-id',
          userId,
        }),
      );
      const dispatch = jest.spyOn(store, 'dispatch');

      render({ addon });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ 'type': FETCH_USER_COLLECTIONS }),
      );
    });
  });

  describe('selecting a user collection', () => {
    it('renders a disabled select when loading user collections', () => {
      const userId = 10;
      dispatchSignInActions({ store, userId });
      store.dispatch(
        fetchUserCollections({
          errorHandlerId: 'some-id',
          userId,
        }),
      );

      render();

      expect(screen.getByRole('combobox')).toHaveAttribute('disabled');
      expect(screen.getByRole('option')).toHaveTextContent('Loading…');
    });

    it('renders a disabled select when adding add-on to collection', async () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const userId = 10;
      signInAndDispatchCollections({ userId });

      render({ addon });

      store.dispatch(
        addAddonToCollection({
          addonId: addon.id,
          userId,
          collectionId: 321,
          slug: 'some-collection',
          errorHandlerId: 'error-handler',
        }),
      );

      expect(await screen.findByRole('combobox')).toHaveAttribute('disabled');
      expect(screen.getByRole('option')).toHaveTextContent('Adding…');
    });

    it('does not render collection optgroup without collections', () => {
      dispatchSignInActions({ store });
      render();

      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });

    it('dispatches the expected action when a user selects a collection', async () => {
      const addon = createInternalAddonWithLang({ ...fakeAddon, id: 234 });
      const secondName = 'second';
      const userId = 10;

      const { firstCollection, secondCollection } = createSomeCollections({
        secondName,
        userId,
      });
      signInAndDispatchCollections({
        userId,
        collections: [firstCollection, secondCollection],
      });
      const dispatch = jest.spyOn(store, 'dispatch');

      render({ addon });

      await userEvent.selectOptions(screen.getByRole('combobox'), secondName);

      expect(dispatch).toHaveBeenCalledWith(
        addAddonToCollection({
          errorHandlerId: createErrorHandlerId({ addon, userId }),
          addonId: addon.id,
          collectionId: secondCollection.id,
          slug: secondCollection.slug,
          userId,
        }),
      );
    });

    it('sorts collection by name in select box', () => {
      const addon = createInternalAddonWithLang({ ...fakeAddon, id: 234 });
      const firstName = 'a collection';
      const secondName = 'b collection';
      const userId = 10;

      const { firstCollection, secondCollection } = createSomeCollections({
        firstName,
        secondName,
        userId,
      });

      // inserting secondCollection first in array
      signInAndDispatchCollections({
        userId,
        collections: [secondCollection, firstCollection],
      });

      render({ addon });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('Select a collection…');
      expect(options[1]).toHaveTextContent('Create new collection');
      expect(options[2]).toHaveTextContent(firstName);
      expect(options[3]).toHaveTextContent(secondName);
    });

    it('displays expected name for collections without names', () => {
      const addon = createInternalAddonWithLang({ ...fakeAddon, id: 234 });
      const userId = 10;

      const { firstCollection, secondCollection } = createSomeCollections({
        firstName: null,
        userId,
      });

      signInAndDispatchCollections({
        userId,
        collections: [firstCollection, secondCollection],
      });

      render({ addon });

      const options = screen.getAllByRole('option');
      expect(options[2]).toHaveTextContent(
        collectionName({ name: null, jed: fakeI18n() }),
      );
    });

    it('shows a notice that you added to a collection', async () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const firstName = 'a collection';
      const userId = 10;

      const { firstCollection } = createSomeCollections({ firstName, userId });

      // This enables the saga for this test, which will execute the mocked
      // createCollectionAddon API function and continue after that.
      store = createStoreWithSaga();

      signInAndDispatchCollections({
        userId,
        collections: [firstCollection],
      });

      render({ addon });

      await userEvent.selectOptions(screen.getByRole('combobox'), firstName);

      expect(screen.getByClassName('Notice-success')).toHaveTextContent(
        `Added to ${firstName}`,
      );
    });

    it('shows notices for each target collection', async () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const firstName = 'a collection';
      const secondName = 'b collection';
      const userId = 10;

      const { firstCollection, secondCollection } = createSomeCollections({
        firstName,
        secondName,
        userId,
      });

      store = createStoreWithSaga();

      signInAndDispatchCollections({
        userId,
        collections: [firstCollection, secondCollection],
      });

      render({ addon });

      await userEvent.selectOptions(screen.getByRole('combobox'), firstName);
      await userEvent.selectOptions(screen.getByRole('combobox'), secondName);

      expect(screen.getByText(`Added to ${firstName}`)).toBeInTheDocument();
      expect(screen.getByText(`Added to ${secondName}`)).toBeInTheDocument();
    });

    it('uses expected name in the notice when the collection name is missing', async () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const userId = 10;

      const { firstCollection } = createSomeCollections({
        firstName: null,
        userId,
      });

      store = createStoreWithSaga();

      signInAndDispatchCollections({
        userId,
        collections: [firstCollection],
      });

      render({ addon });

      await userEvent.selectOptions(screen.getByRole('combobox'), '(no name)');

      expect(screen.getByText('Added to (no name)')).toBeInTheDocument();
    });

    it('does nothing when you select the prompt', async () => {
      signInAndDispatchCollections();
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      dispatch.mockClear();

      await userEvent.selectOptions(
        screen.getByRole('combobox'),
        'Select a collection…',
      );

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('lets you create a new collection by navigating to the collection page', async () => {
      const clientApp = CLIENT_APP_FIREFOX;
      const lang = DEFAULT_LANG_IN_TESTS;
      const id = 234;

      const addon = createInternalAddonWithLang({ ...fakeAddon, id });

      signInAndDispatchCollections({
        clientApp,
        lang,
      });

      const history = createHistory();
      const pushSpy = jest.spyOn(history, 'push');
      render({ addon, history });

      await userEvent.selectOptions(
        screen.getByRole('combobox'),
        'Create new collection',
      );

      expect(pushSpy).toHaveBeenCalledWith(
        `/${lang}/${clientApp}/collections/add/?include_addon_id=${id}`,
      );
    });
  });

  describe('error handling', () => {
    it('renders an error', () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const userId = 345;

      // This enables the saga for this test, which will execute the mocked
      // getAllUserCollections API function, which will throw an exception.
      store = createStoreWithSaga();

      dispatchSignInActions({ store, userId });

      render({ addon });

      expect(
        screen.getByText('An unexpected error occurred'),
      ).toBeInTheDocument();
    });

    it('does not fetch data when there is an error', () => {
      dispatchSignInActions({ store });
      const errorHandler = new ErrorHandler({
        dispatch: store.dispatch,
        id: 'some-error-handler',
      });
      errorHandler.handle(new Error());
      const dispatch = jest.spyOn(store, 'dispatch');

      render({ errorHandler });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ 'type': FETCH_USER_COLLECTIONS }),
      );
    });
  });

  describe('extractId', () => {
    it('renders an ID without an add-on or user', () => {
      expect(extractId({ addon: null, currentUserId: null })).toEqual('-');
    });

    it('renders an ID with an add-on ID and user', () => {
      const addon = createInternalAddonWithLang({ ...fakeAddon, id: 5432 });
      const currentUserId = 123;

      expect(extractId({ addon, currentUserId })).toEqual(
        `${addon.id}-${currentUserId}`,
      );
    });
  });
});
