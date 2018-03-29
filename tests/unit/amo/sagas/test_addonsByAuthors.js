import deepEqual from 'deep-eql';
import SagaTester from 'redux-saga-tester';

import addonsByAuthorsReducer, {
  ADDONS_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import addonsByAuthorsSaga from 'amo/sagas/addonsByAuthors';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_TRENDING,
} from 'core/constants';
import * as searchApi from 'core/api/search';
import apiReducer from 'core/reducers/api';
import {
  createAddonsApiResult,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import { createStubErrorHandler } from 'tests/unit/helpers';


describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(searchApi);
    sagaTester = new SagaTester({
      initialState: dispatchClientMetadata().state,
      reducers: {
        api: apiReducer,
        addonsByAuthorNames: addonsByAuthorsReducer,
      },
    });
    sagaTester.start(addonsByAuthorsSaga);
  });

  function _fetchAddonsByAuthors(params) {
    sagaTester.dispatch(fetchAddonsByAuthors({
      errorHandlerId: errorHandler.id,
      ...params,
    }));
  }

  it('calls the API to retrieve other add-ons', async () => {
    const fakeAddons = [{ ...fakeAddon, id: 54, slug: 'fifty-four' }];
    const fakeThemes = [
      { ...fakeAddon, id: 55, slug: 'fifty-five', type: ADDON_TYPE_THEME },
    ];
    const authorNames = ['mozilla', 'johnedoe'];
    const state = sagaTester.getState();

    mockApi
      .expects('search')
      .withArgs({
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_THEME,
          author: authorNames.sort().join(','),
          exclude_addons: undefined, // `callApi` will internally unset this
          page_size: ADDONS_BY_AUTHORS_PAGE_SIZE,
          sort: SEARCH_SORT_TRENDING,
        },
      })
      .once()
      .returns(Promise.resolve(createAddonsApiResult(fakeThemes)));

    mockApi
      .expects('search')
      .withArgs({
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          author: authorNames.sort().join(','),
          exclude_addons: undefined, // `callApi` will internally unset this
          page_size: ADDONS_BY_AUTHORS_PAGE_SIZE,
          sort: SEARCH_SORT_TRENDING,
        },
      })
      .once()
      .returns(Promise.resolve(createAddonsApiResult(fakeAddons)));

    _fetchAddonsByAuthors({ addonType: ADDON_TYPE_THEME, authorNames });
    _fetchAddonsByAuthors({ addonType: ADDON_TYPE_EXTENSION, authorNames });

    const loadActionForAddons = loadAddonsByAuthors({
      addons: fakeAddons,
      addonType: ADDON_TYPE_EXTENSION,
      authorNames,
      forAddonSlug: undefined,
    });
    const loadActionForThemes = loadAddonsByAuthors({
      addons: fakeThemes,
      addonType: ADDON_TYPE_THEME,
      authorNames,
      forAddonSlug: undefined,
    });

    await sagaTester.waitFor(loadActionForAddons.type);
    mockApi.verify();

    let matchingActions = 0;
    sagaTester.getCalledActions().filter((action) => {
      return action.type === loadActionForAddons.type;
    }).forEach((action) => {
      if (
        deepEqual(action, loadActionForAddons) ||
        deepEqual(action, loadActionForThemes)
      ) {
        matchingActions++;
      }
    });

    expect(matchingActions).toEqual(2);
  });

  it('calls the API multiple times for different addonType', async () => {
    const addons = [fakeAddon];
    const authorNames = ['mozilla'];
    const state = sagaTester.getState();

    mockApi
      .expects('search')
      .withArgs({
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_THEME,
          author: authorNames.sort().join(','),
          exclude_addons: undefined, // `callApi` will internally unset this
          page_size: ADDONS_BY_AUTHORS_PAGE_SIZE,
          sort: SEARCH_SORT_TRENDING,
        },
      })
      .once()
      .returns(Promise.resolve(createAddonsApiResult(addons)));

    _fetchAddonsByAuthors({ authorNames, addonType: ADDON_TYPE_THEME });

    const expectedLoadAction = loadAddonsByAuthors({
      addons,
      addonType: ADDON_TYPE_THEME,
      authorNames,
      forAddonSlug: undefined,
    });

    const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('sends `exclude_addons` param if `forAddonSlug` is set', async () => {
    const addons = [fakeAddon];
    const authorNames = ['mozilla', 'johnedoe'];
    const { slug } = fakeAddon;
    const state = sagaTester.getState();

    mockApi
      .expects('search')
      .withArgs({
        api: state.api,
        filters: {
          addonType: undefined,
          author: authorNames.sort().join(','),
          exclude_addons: slug,
          page_size: ADDONS_BY_AUTHORS_PAGE_SIZE,
          sort: SEARCH_SORT_TRENDING,
        },
      })
      .once()
      .returns(Promise.resolve(createAddonsApiResult(addons)));

    _fetchAddonsByAuthors({ authorNames, forAddonSlug: slug });

    const expectedLoadAction = loadAddonsByAuthors({
      addons,
      authorNames,
      forAddonSlug: slug,
    });

    const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _fetchAddonsByAuthors({ authorNames: [], forAddonSlug: fakeAddon.slug });

    const expectedAction = errorHandler.createClearingAction();

    const errorAction = await sagaTester.waitFor(expectedAction.type);

    expect(errorAction).toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('search')
      .once()
      .returns(Promise.reject(error));

    _fetchAddonsByAuthors({ authorNames: [], forAddonSlug: fakeAddon.slug });

    const errorAction = errorHandler.createErrorAction(error);
    const calledErrorAction = await sagaTester.waitFor(errorAction.type);

    expect(calledErrorAction).toEqual(errorAction);
  });

  it('handles no API results', async () => {
    const addons = [];
    const authorNames = ['mozilla', 'johnedoe'];
    const { slug } = fakeAddon;
    const state = sagaTester.getState();

    mockApi
      .expects('search')
      .withArgs({
        api: state.api,
        filters: {
          addonType: undefined,
          author: authorNames.sort().join(','),
          exclude_addons: slug,
          page_size: ADDONS_BY_AUTHORS_PAGE_SIZE,
          sort: SEARCH_SORT_TRENDING,
        },
      })
      .once()
      .returns(Promise.resolve(createAddonsApiResult(addons)));

    _fetchAddonsByAuthors({ authorNames, forAddonSlug: slug });

    const expectedLoadAction = loadAddonsByAuthors({
      addons,
      authorNames,
      forAddonSlug: slug,
    });

    const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(loadAction).toEqual(expectedLoadAction);
  });
});
