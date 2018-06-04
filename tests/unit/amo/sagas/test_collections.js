import SagaTester from 'redux-saga-tester';
import { push as pushLocation } from 'react-router-redux';

import * as collectionsApi from 'amo/api/collections';
import collectionsReducer, {
  abortAddAddonToCollection,
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  addAddonToCollection,
  addonAddedToCollection,
  beginCollectionModification,
  createCollection,
  removeAddonFromCollection,
  deleteCollectionBySlug,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  fetchUserCollections,
  finishCollectionModification,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
  localizeCollectionDetail,
  updateCollection,
} from 'amo/reducers/collections';
import collectionsSaga from 'amo/sagas/collections';
import apiReducer from 'core/reducers/api';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  const user = 'user-id-or-name';
  const slug = 'collection-slug';
  const page = 1;

  let clientData;
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(collectionsApi);
    clientData = dispatchClientMetadata();
    sagaTester = new SagaTester({
      initialState: clientData.state,
      reducers: {
        api: apiReducer,
        collections: collectionsReducer,
      },
    });
    sagaTester.start(collectionsSaga);
  });

  describe('fetchCurrentCollection', () => {
    function _fetchCurrentCollection(params) {
      sagaTester.dispatch(fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        ...params,
      }));
    }

    it('calls the API to fetch a collection', async () => {
      const state = sagaTester.getState();

      const collectionAddons = createFakeCollectionAddonsListResponse();
      const collectionDetail = createFakeCollectionDetail();

      mockApi
        .expects('getCollectionDetail')
        .withArgs({
          api: state.api,
          slug,
          user,
        })
        .once()
        .returns(Promise.resolve(collectionDetail));

      mockApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          page,
          slug,
          user,
        })
        .once()
        .returns(Promise.resolve(collectionAddons));

      _fetchCurrentCollection({ page, slug, user });

      const expectedLoadAction = loadCurrentCollection({
        addons: collectionAddons.results,
        detail: collectionDetail,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchCurrentCollection({ slug, user });

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('getCollectionDetail')
        .once()
        .returns(Promise.reject(error));

      _fetchCurrentCollection({ slug, user });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(expectedAction).toEqual(action);
      expect(sagaTester.getCalledActions()[3]).toEqual(abortFetchCurrentCollection());
    });
  });

  describe('fetchCurrentCollectionPage', () => {
    function _fetchCurrentCollectionPage(params) {
      sagaTester.dispatch(fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        ...params,
      }));
    }

    it('calls the API to fetch a collection page', async () => {
      const state = sagaTester.getState();

      const collectionAddons = createFakeCollectionAddonsListResponse();
      mockApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          page,
          slug,
          user,
        })
        .once()
        .returns(Promise.resolve(collectionAddons));

      _fetchCurrentCollectionPage({ page, slug, user });

      const expectedLoadAction = loadCurrentCollectionPage({
        addons: collectionAddons.results,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchCurrentCollectionPage({ page, slug, user });

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('getCollectionAddons')
        .once()
        .returns(Promise.reject(error));

      _fetchCurrentCollectionPage({ page, slug, user });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      expect(sagaTester.getCalledActions()[3]).toEqual(abortFetchCurrentCollection());
    });
  });

  describe('fetchUserCollections', () => {
    const _fetchUserCollections = (params) => {
      sagaTester.dispatch(fetchUserCollections({
        errorHandlerId: errorHandler.id,
        userId: 321,
        ...params,
      }));
    };

    it('calls the API to fetch user collections', async () => {
      const userId = 43321;
      const state = sagaTester.getState();

      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });
      const externalCollections = [firstCollection, secondCollection];

      mockApi
        .expects('getAllUserCollections')
        .withArgs({
          api: state.api,
          user: userId,
        })
        .once()
        .returns(Promise.resolve(externalCollections));

      _fetchUserCollections({ userId });

      const expectedLoadAction = loadUserCollections({
        userId, collections: externalCollections,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchUserCollections();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const userId = 55432;
      const error = new Error('some API error maybe');

      mockApi
        .expects('getAllUserCollections')
        .once()
        .returns(Promise.reject(error));

      _fetchUserCollections({ userId });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      expect(sagaTester.getCalledActions()[3])
        .toEqual(abortFetchUserCollections({ userId }));
    });
  });

  describe('addAddonToCollection', () => {
    const _addAddonToCollection = (params = {}) => {
      sagaTester.dispatch(addAddonToCollection({
        addonId: 543,
        collectionId: 321,
        slug: 'some-collection',
        errorHandlerId: errorHandler.id,
        userId: 321,
        ...params,
      }));
    };

    it('posts an add-on to a collection', async () => {
      const params = {
        addonId: 123,
        collectionId: 5432,
        slug: 'a-collection',
        userId: 543,
      };
      const state = sagaTester.getState();

      mockApi
        .expects('createCollectionAddon')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          slug: params.slug,
          notes: undefined,
          user: params.userId,
        })
        .once()
        .returns(Promise.resolve());

      _addAddonToCollection(params);

      const expectedAddedAction = addonAddedToCollection({
        addonId: params.addonId,
        collectionId: params.collectionId,
        userId: params.userId,
      });

      const addedAction = await sagaTester.waitFor(expectedAddedAction.type);
      expect(addedAction).toEqual(expectedAddedAction);

      const unexpectedFetchAction = fetchCurrentCollectionPage({
        page: 1,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        user: params.userId,
      });

      expect(sagaTester.wasCalled(unexpectedFetchAction.type)).toEqual(false);
      mockApi.verify();
    });

    it('posts an add-on to a collection while the collection is being edited', async () => {
      const params = {
        addonId: 123,
        collectionId: 5432,
        slug: 'a-collection',
        editing: true,
        page: 1,
        userId: 543,
      };
      const state = sagaTester.getState();

      mockApi
        .expects('createCollectionAddon')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          slug: params.slug,
          notes: undefined,
          user: params.userId,
        })
        .once()
        .returns(Promise.resolve());

      _addAddonToCollection(params);

      const expectedFetchAction = fetchCurrentCollectionPage({
        page: params.page,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        user: params.userId,
      });

      const fetchAction = await sagaTester.waitFor(expectedFetchAction.type);
      expect(fetchAction).toEqual(expectedFetchAction);

      const expectedAddedAction = addonAddedToCollection({
        addonId: params.addonId,
        collectionId: params.collectionId,
        userId: params.userId,
      });

      const addedAction = await sagaTester.waitFor(expectedAddedAction.type);
      expect(addedAction).toEqual(expectedAddedAction);

      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _addAddonToCollection();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const addonId = 8876;
      const userId = 12334;
      const error = new Error('some API error maybe');

      mockApi
        .expects('createCollectionAddon')
        .returns(Promise.reject(error));

      _addAddonToCollection({ addonId, userId });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      expect(sagaTester.getCalledActions()[3])
        .toEqual(abortAddAddonToCollection({ addonId, userId }));
    });
  });

  describe('modifyCollection', () => {
    const _createCollection = (params = {}) => {
      sagaTester.dispatch(createCollection({
        errorHandlerId: errorHandler.id,
        name: 'some-collection-name',
        slug,
        user,
        ...params,
      }));
    };

    const _updateCollection = (params = {}) => {
      sagaTester.dispatch(updateCollection({
        errorHandlerId: errorHandler.id,
        collectionSlug: 'some-collection',
        slug,
        user,
        ...params,
      }));
    };

    describe('common logic', () => {
      // The common logic can be tested either by dispatching updateCollection
      // or createCollection, so we just use _updateCollection.
      it('clears the error handler', async () => {
        _updateCollection();

        const expectedAction = errorHandler.createClearingAction();

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
      });

      it('handles errors', async () => {
        const error = new Error('some API error maybe');

        mockApi
          .expects('updateCollection')
          .returns(Promise.reject(error));

        _updateCollection();

        const expectedAction = errorHandler.createErrorAction(error);
        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
      });

      it('records the beginning of a modification in state', async () => {
        const collectionSlug = 'my-slug';

        mockApi
          .expects('updateCollection')
          .returns(Promise.resolve());

        _updateCollection({ collectionSlug });

        const expectedAction = beginCollectionModification();

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
      });

      it('records the end of a modification in state on error', async () => {
        const collectionSlug = 'my-slug';
        const error = new Error('some API error maybe');

        mockApi
          .expects('updateCollection')
          .returns(Promise.reject(error));

        _updateCollection({ collectionSlug });

        const expectedAction = finishCollectionModification();

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
      });

      it('records the end of a modification in state on success', async () => {
        mockApi.expects('updateCollection').returns(Promise.resolve());

        const collectionSlug = 'some-collection';
        _updateCollection({ collectionSlug });

        const expectedAction = finishCollectionModification();

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
        mockApi.verify();
      });
    });

    describe('update logic', () => {
      it('sends a request to the collection API', async () => {
        const params = {
          collectionSlug: 'a-collection',
          description: { 'en-US': 'New collection description' },
          name: { 'en-US': 'New collection name' },
          slug: 'new-slug',
          user,
        };
        const state = sagaTester.getState();

        mockApi
          .expects('updateCollection')
          .withArgs({
            api: state.api,
            collectionSlug: params.collectionSlug,
            defaultLocale: undefined,
            description: params.description,
            name: params.name,
            slug: params.slug,
            user,
          })
          .once()
          .returns(Promise.resolve());

        _updateCollection(params);

        const expectedAction = finishCollectionModification();

        await sagaTester.waitFor(expectedAction.type);
        mockApi.verify();
      });

      it('deletes collection object after successful update', async () => {
        mockApi.expects('updateCollection').returns(Promise.resolve());

        const collectionSlug = 'some-collection';
        // For this test, make sure the slug is not getting updated.
        _updateCollection({ collectionSlug, slug: undefined });

        const expectedAction = deleteCollectionBySlug(collectionSlug);

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
        mockApi.verify();
      });

      it('does not delete collection when slug is changed', async () => {
        mockApi.expects('updateCollection').returns(Promise.resolve());

        const collectionSlug = 'some-collection';
        _updateCollection({
          collectionSlug, slug: 'new-slug',
        });

        const expectedAction = finishCollectionModification();

        await sagaTester.waitFor(expectedAction.type);
        mockApi.verify();

        // Make sure the the collection is not deleted.
        expect(
          sagaTester.getCalledActions().map((action) => action.type)
        ).not.toContain(deleteCollectionBySlug(collectionSlug).type);
      });

      it('redirects to the existing slug after update', async () => {
        mockApi.expects('updateCollection').returns(Promise.resolve());

        const collectionSlug = 'some-collection';
        // Update everything except the slug.
        _updateCollection({
          collectionSlug, user, slug: undefined,
        });

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation(
          `/${lang}/${clientApp}/collections/${user}/${collectionSlug}/`
        );

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);

        mockApi.verify();
      });

      it('redirects to the new slug after update', async () => {
        mockApi.expects('updateCollection').returns(Promise.resolve());

        const newSlug = 'new-slug';
        _updateCollection({ user, slug: newSlug });

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation(
          `/${lang}/${clientApp}/collections/${user}/${newSlug}/`
        );

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
        mockApi.verify();
      });
    });

    describe('create logic', () => {
      const getParams = ({ lang }) => {
        return {
          description: { [lang]: 'Collection description' },
          name: { [lang]: 'Collection name' },
          slug,
          user,
        };
      };

      it('sends a request to the collections API', async () => {
        const state = sagaTester.getState();
        const params = getParams({ lang: state.api.lang });

        const collectionDetailResponse = createFakeCollectionDetail(params);

        mockApi
          .expects('createCollection')
          .withArgs({
            api: state.api,
            defaultLocale: undefined,
            description: params.description,
            name: params.name,
            slug,
            user,
          })
          .once()
          .returns(Promise.resolve(collectionDetailResponse));

        _createCollection(params);

        const expectedLoadAction = loadCurrentCollection({
          addons: [],
          detail: localizeCollectionDetail({
            detail: collectionDetailResponse,
            lang: state.api.lang,
          }),
        });

        const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
        expect(loadAction).toEqual(expectedLoadAction);

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation(
          `/${lang}/${clientApp}/collections/${user}/${slug}/edit/`
        );

        await sagaTester.waitFor(expectedAction.type);
        mockApi.verify();
      });

      it('redirects to the collection edit screen after create', async () => {
        const state = sagaTester.getState();
        const params = getParams({ lang: state.api.lang });

        const collectionDetailResponse = createFakeCollectionDetail(params);

        mockApi
          .expects('createCollection')
          .once()
          .returns(Promise.resolve(collectionDetailResponse));

        _createCollection(params);

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation(
          `/${lang}/${clientApp}/collections/${user}/${slug}/edit/`
        );

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);

        mockApi.verify();
      });
    });
  });

  describe('removeAddonFromCollection', () => {
    const _removeAddonFromCollection = (params = {}) => {
      sagaTester.dispatch(removeAddonFromCollection({
        addonId: 543,
        errorHandlerId: errorHandler.id,
        page: 1,
        slug: 'some-collection',
        user: 'some-user',
        ...params,
      }));
    };

    it('deletes an add-on from a collection', async () => {
      const params = {
        addonId: 123,
        page: 2,
        slug: 'some-other-slug',
        user: 'some-other-user',
      };
      const state = sagaTester.getState();

      mockApi
        .expects('removeAddonFromCollection')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          slug: params.slug,
          user: params.user,
        })
        .once()
        .returns(Promise.resolve());

      _removeAddonFromCollection(params);

      const expectedFetchAction = fetchCurrentCollectionPage({
        page: params.page,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        user: params.user,
      });

      const fetchAction = await sagaTester.waitFor(expectedFetchAction.type);
      expect(fetchAction).toEqual(expectedFetchAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _removeAddonFromCollection();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('removeAddonFromCollection')
        .returns(Promise.reject(error));

      _removeAddonFromCollection();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });
});
