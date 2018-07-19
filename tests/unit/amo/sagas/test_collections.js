import SagaTester from 'redux-saga-tester';
import { push as pushLocation } from 'connected-react-router';

import * as collectionsApi from 'amo/api/collections';
import collectionsReducer, {
  abortAddAddonToCollection,
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  addAddonToCollection,
  addonAddedToCollection,
  beginCollectionModification,
  createCollection,
  deleteCollection,
  deleteCollectionAddonNotes,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  fetchUserCollections,
  finishCollectionModification,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
  localizeCollectionDetail,
  removeAddonFromCollection,
  unloadCollectionBySlug,
  updateCollection,
  updateCollectionAddon,
} from 'amo/reducers/collections';
import collectionsSaga from 'amo/sagas/collections';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import apiReducer from 'core/reducers/api';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const username = 'some-user';
  const slug = 'collection-slug';
  const filters = { page: 1 };

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
      sagaTester.dispatch(
        fetchCurrentCollection({
          errorHandlerId: errorHandler.id,
          ...params,
        }),
      );
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
          username,
        })
        .once()
        .returns(Promise.resolve(collectionDetail));

      mockApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          filters,
          slug,
          username,
        })
        .once()
        .returns(Promise.resolve(collectionAddons));

      _fetchCurrentCollection({ filters, slug, username });

      const expectedLoadAction = loadCurrentCollection({
        addons: collectionAddons.results,
        detail: collectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchCurrentCollection({ slug, username });

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

      _fetchCurrentCollection({ slug, username });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(expectedAction).toEqual(action);
      expect(sagaTester.getCalledActions()[3]).toEqual(
        abortFetchCurrentCollection(),
      );
    });
  });

  describe('fetchCurrentCollectionPage', () => {
    function _fetchCurrentCollectionPage(params) {
      sagaTester.dispatch(
        fetchCurrentCollectionPage({
          errorHandlerId: errorHandler.id,
          ...params,
        }),
      );
    }

    it('calls the API to fetch a collection page', async () => {
      const state = sagaTester.getState();

      const collectionAddons = createFakeCollectionAddonsListResponse();
      mockApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          filters,
          slug,
          username,
        })
        .once()
        .returns(Promise.resolve(collectionAddons));

      _fetchCurrentCollectionPage({ filters, slug, username });

      const expectedLoadAction = loadCurrentCollectionPage({
        addons: collectionAddons.results,
        numberOfAddons: collectionAddons.count,
        pageSize: DEFAULT_API_PAGE_SIZE,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchCurrentCollectionPage({ filters, slug, username });

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

      _fetchCurrentCollectionPage({ filters, slug, username });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      expect(sagaTester.getCalledActions()[3]).toEqual(
        abortFetchCurrentCollection(),
      );
    });
  });

  describe('fetchUserCollections', () => {
    const _fetchUserCollections = (params) => {
      sagaTester.dispatch(
        fetchUserCollections({
          errorHandlerId: errorHandler.id,
          username: 'some-user',
          ...params,
        }),
      );
    };

    it('calls the API to fetch user collections', async () => {
      const state = sagaTester.getState();

      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });
      const externalCollections = [firstCollection, secondCollection];

      mockApi
        .expects('getAllUserCollections')
        .withArgs({
          api: state.api,
          username,
        })
        .once()
        .returns(Promise.resolve(externalCollections));

      _fetchUserCollections({ username });

      const expectedLoadAction = loadUserCollections({
        username,
        collections: externalCollections,
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
      const error = new Error('some API error maybe');

      mockApi
        .expects('getAllUserCollections')
        .once()
        .returns(Promise.reject(error));

      _fetchUserCollections({ username });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      expect(sagaTester.getCalledActions()[3]).toEqual(
        abortFetchUserCollections({ username }),
      );
    });
  });

  describe('addAddonToCollection', () => {
    const _addAddonToCollection = (params = {}) => {
      sagaTester.dispatch(
        addAddonToCollection({
          addonId: 543,
          collectionId: 321,
          slug: 'some-collection',
          errorHandlerId: errorHandler.id,
          username: 'some-user',
          ...params,
        }),
      );
    };

    it('posts an add-on to a collection', async () => {
      const params = {
        addonId: 123,
        collectionId: 5432,
        slug: 'a-collection',
        username: 'some-user',
      };
      const state = sagaTester.getState();

      mockApi
        .expects('createCollectionAddon')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          slug: params.slug,
          notes: undefined,
          username: params.username,
        })
        .once()
        .returns(Promise.resolve());

      _addAddonToCollection(params);

      const expectedAddedAction = addonAddedToCollection({
        addonId: params.addonId,
        collectionId: params.collectionId,
        username: params.username,
      });

      const addedAction = await sagaTester.waitFor(expectedAddedAction.type);
      expect(addedAction).toEqual(expectedAddedAction);

      const unexpectedFetchAction = fetchCurrentCollectionPage({
        filters,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        username: params.username,
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
        filters: { page: 1 },
        username: 'some-user',
      };
      const state = sagaTester.getState();

      mockApi
        .expects('createCollectionAddon')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          slug: params.slug,
          notes: undefined,
          username: params.username,
        })
        .once()
        .returns(Promise.resolve());

      _addAddonToCollection(params);

      const expectedFetchAction = fetchCurrentCollectionPage({
        filters: params.filters,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        username: params.username,
      });

      const fetchAction = await sagaTester.waitFor(expectedFetchAction.type);
      expect(fetchAction).toEqual(expectedFetchAction);

      const expectedAddedAction = addonAddedToCollection({
        addonId: params.addonId,
        collectionId: params.collectionId,
        username: params.username,
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
      const error = new Error('some API error maybe');

      mockApi.expects('createCollectionAddon').returns(Promise.reject(error));

      _addAddonToCollection({ addonId, username });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      expect(sagaTester.getCalledActions()[3]).toEqual(
        abortAddAddonToCollection({ addonId, username }),
      );
    });
  });

  describe('modifyCollection', () => {
    const _createCollection = (params = {}) => {
      sagaTester.dispatch(
        createCollection({
          errorHandlerId: errorHandler.id,
          name: 'some-collection-name',
          slug,
          username,
          ...params,
        }),
      );
    };

    const _updateCollection = (params = {}) => {
      sagaTester.dispatch(
        updateCollection({
          collectionSlug: 'some-collection',
          errorHandlerId: errorHandler.id,
          filters: { page: 1 },
          slug,
          username,
          ...params,
        }),
      );
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

        mockApi.expects('updateCollection').returns(Promise.reject(error));

        _updateCollection();

        const expectedAction = errorHandler.createErrorAction(error);
        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
      });

      it('records the beginning of a modification in state', async () => {
        const collectionSlug = 'my-slug';

        mockApi.expects('updateCollection').returns(Promise.resolve());

        _updateCollection({ collectionSlug });

        const expectedAction = beginCollectionModification();

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
      });

      it('records the end of a modification in state on error', async () => {
        const collectionSlug = 'my-slug';
        const error = new Error('some API error maybe');

        mockApi.expects('updateCollection').returns(Promise.reject(error));

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
          username,
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
            username,
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

        const expectedAction = unloadCollectionBySlug(collectionSlug);

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);
        mockApi.verify();
      });

      it('does not delete collection when slug is changed', async () => {
        mockApi.expects('updateCollection').returns(Promise.resolve());

        const collectionSlug = 'some-collection';
        _updateCollection({
          collectionSlug,
          slug: 'new-slug',
        });

        const expectedAction = finishCollectionModification();

        await sagaTester.waitFor(expectedAction.type);
        mockApi.verify();

        // Make sure the the collection is not unloaded.
        expect(
          sagaTester.getCalledActions().map((action) => action.type),
        ).not.toContain(unloadCollectionBySlug(collectionSlug).type);
      });

      it('redirects to the resulting slug after update', async () => {
        const submittedSlug = 'submitted-slug';
        const returnedSlug = 'returned-slug';

        const collectionDetailResponse = createFakeCollectionDetail({
          slug: returnedSlug,
        });

        mockApi
          .expects('updateCollection')
          .returns(Promise.resolve(collectionDetailResponse));

        const collectionSlug = 'some-collection';
        const updateFilters = { page: 2 };
        _updateCollection({
          collectionSlug,
          filters: updateFilters,
          slug: submittedSlug,
          username,
        });

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation({
          pathname: `/${lang}/${clientApp}/collections/${username}/${returnedSlug}/`,
          query: convertFiltersToQueryParams(updateFilters),
        });

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
          username,
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
            username,
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
          pageSize: null,
        });

        const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
        expect(loadAction).toEqual(expectedLoadAction);

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation(
          `/${lang}/${clientApp}/collections/${username}/${slug}/edit/`,
        );

        await sagaTester.waitFor(expectedAction.type);
        mockApi.verify();
      });

      it('also sends a request to add an add-on if includeAddonId is set', async () => {
        const state = sagaTester.getState();
        const id = 12344;
        const params = {
          ...getParams({ lang: state.api.lang }),
          includeAddonId: id,
        };

        const collectionDetailResponse = createFakeCollectionDetail(params);

        mockApi
          .expects('createCollection')
          .once()
          .returns(Promise.resolve(collectionDetailResponse));

        mockApi
          .expects('createCollectionAddon')
          .withArgs({
            addonId: id,
            api: state.api,
            slug: params.slug,
            username: params.username,
          })
          .once()
          .returns(Promise.resolve());

        _createCollection(params);

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation(
          `/${lang}/${clientApp}/collections/${username}/${slug}/edit/`,
        );

        await sagaTester.waitFor(expectedAction.type);
        mockApi.verify();
      });

      it('redirects to the collection edit screen after create', async () => {
        const submittedSlug = 'submitted-slug';
        const returnedSlug = 'returned-slug';
        const state = sagaTester.getState();

        const collectionDetailResponse = createFakeCollectionDetail({
          slug: returnedSlug,
        });

        mockApi
          .expects('createCollection')
          .once()
          .returns(Promise.resolve(collectionDetailResponse));

        _createCollection(
          getParams({ lang: state.api.lang, slug: submittedSlug }),
        );

        const { lang, clientApp } = clientData.state.api;
        const expectedAction = pushLocation(
          `/${lang}/${clientApp}/collections/${username}/${returnedSlug}/edit/`,
        );

        const action = await sagaTester.waitFor(expectedAction.type);
        expect(action).toEqual(expectedAction);

        mockApi.verify();
      });
    });
  });

  describe('removeAddonFromCollection', () => {
    const _removeAddonFromCollection = (params = {}) => {
      sagaTester.dispatch(
        removeAddonFromCollection({
          addonId: 543,
          errorHandlerId: errorHandler.id,
          filters: { page: 1 },
          slug: 'some-collection',
          username: 'some-user',
          ...params,
        }),
      );
    };

    it('deletes an add-on from a collection', async () => {
      const params = {
        addonId: 123,
        filters: { page: 2 },
        slug: 'some-other-slug',
        username: 'some-other-user',
      };
      const state = sagaTester.getState();

      mockApi
        .expects('removeAddonFromCollection')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          slug: params.slug,
          username: params.username,
        })
        .once()
        .returns(Promise.resolve());

      _removeAddonFromCollection(params);

      const expectedFetchAction = fetchCurrentCollectionPage({
        filters: params.filters,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        username: params.username,
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

  describe('deleteCollection', () => {
    const _deleteCollection = (params = {}) => {
      sagaTester.dispatch(
        deleteCollection({
          errorHandlerId: errorHandler.id,
          slug: 'some-collection',
          username: 'some-user',
          ...params,
        }),
      );
    };

    it('deletes a collection', async () => {
      const params = {
        slug: 'some-other-slug',
        username: 'some-other-user',
      };
      const state = sagaTester.getState();
      const { lang, clientApp } = state.api;

      mockApi
        .expects('deleteCollection')
        .withArgs({
          api: state.api,
          slug: params.slug,
          username: params.username,
        })
        .once()
        .returns(Promise.resolve());

      _deleteCollection(params);

      const expectedUnloadAction = unloadCollectionBySlug(params.slug);

      const unloadAction = await sagaTester.waitFor(expectedUnloadAction.type);
      expect(unloadAction).toEqual(expectedUnloadAction);

      const expectedPushAction = pushLocation(
        `/${lang}/${clientApp}/collections/`,
      );

      const pushAction = await sagaTester.waitFor(expectedPushAction.type);
      expect(pushAction).toEqual(expectedPushAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _deleteCollection();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi.expects('deleteCollection').returns(Promise.reject(error));

      _deleteCollection();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });

  describe('updateCollectionAddon', () => {
    const _updateCollectionAddon = (params = {}) => {
      sagaTester.dispatch(
        updateCollectionAddon({
          addonId: 543,
          errorHandlerId: errorHandler.id,
          notes: '',
          filters: { page: 1 },
          slug: 'some-collection',
          username: 'some-user',
          ...params,
        }),
      );
    };

    it('updates notes for a collection add-on', async () => {
      const params = {
        addonId: 123,
        notes: 'Here are some notes',
        filters: { page: 2 },
        slug: 'some-other-slug',
        username: 'some-other-user',
      };
      const state = sagaTester.getState();

      mockApi
        .expects('updateCollectionAddon')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          notes: params.notes,
          slug: params.slug,
          username: params.username,
        })
        .once()
        .returns(Promise.resolve());

      _updateCollectionAddon(params);

      const expectedFetchAction = fetchCurrentCollectionPage({
        filters: params.filters,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        username: params.username,
      });

      const fetchAction = await sagaTester.waitFor(expectedFetchAction.type);
      expect(fetchAction).toEqual(expectedFetchAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _updateCollectionAddon();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi.expects('updateCollectionAddon').returns(Promise.reject(error));

      _updateCollectionAddon();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });

  describe('deleteCollectionAddonNotes', () => {
    it('deletes notes for a collection add-on by updating the notes to an empty string', async () => {
      const params = {
        addonId: 123,
        filters: { page: 2 },
        slug: 'some-other-slug',
        username: 'some-other-user',
      };
      const state = sagaTester.getState();

      mockApi
        .expects('updateCollectionAddon')
        .withArgs({
          addonId: params.addonId,
          api: state.api,
          notes: '',
          slug: params.slug,
          username: params.username,
        })
        .once()
        .returns(Promise.resolve());

      sagaTester.dispatch(
        deleteCollectionAddonNotes({
          errorHandlerId: errorHandler.id,
          ...params,
        }),
      );

      const expectedFetchAction = fetchCurrentCollectionPage({
        filters: params.filters,
        errorHandlerId: errorHandler.id,
        slug: params.slug,
        username: params.username,
      });

      const fetchAction = await sagaTester.waitFor(expectedFetchAction.type);
      expect(fetchAction).toEqual(expectedFetchAction);
      mockApi.verify();
    });
  });
});
