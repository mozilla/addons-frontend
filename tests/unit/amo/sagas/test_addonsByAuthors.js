import SagaTester from 'redux-saga-tester';

import addonsByAuthorsReducer, {
  OTHER_ADDONS_BY_AUTHORS_PAGE_SIZE,
  fetchOtherAddonsByAuthors,
  loadOtherAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import addonsByAuthorsSaga from 'amo/sagas/addonsByAuthors';
import {
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
        addonsByAuthors: addonsByAuthorsReducer,
      },
    });
    sagaTester.start(addonsByAuthorsSaga);
  });

  function _fetchOtherAddonsByAuthors(params) {
    sagaTester.dispatch(fetchOtherAddonsByAuthors({
      errorHandlerId: errorHandler.id,
      addonType: ADDON_TYPE_THEME,
      ...params,
    }));
  }

  it('calls the API to retrieve other add-ons', async () => {
    const addons = [fakeAddon];
    const authors = ['mozilla', 'johnedoe'];
    const { slug } = fakeAddon;
    const state = sagaTester.getState();

    mockApi
      .expects('search')
      .withArgs({
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_THEME,
          author: authors.join(','),
          exclude_addons: slug,
          page_size: OTHER_ADDONS_BY_AUTHORS_PAGE_SIZE,
          sort: SEARCH_SORT_TRENDING,
        },
      })
      .once()
      .returns(Promise.resolve(createAddonsApiResult(addons)));

    _fetchOtherAddonsByAuthors({ authors, slug });

    const expectedLoadAction = loadOtherAddonsByAuthors({ addons, slug });

    await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _fetchOtherAddonsByAuthors({ authors: [], slug: fakeAddon.slug });

    const expectedAction = errorHandler.createClearingAction();

    await sagaTester.waitFor(expectedAction.type);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('search')
      .once()
      .returns(Promise.reject(error));

    _fetchOtherAddonsByAuthors({ authors: [], slug: fakeAddon.slug });

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });

  it('handles no API results', async () => {
    const addons = [];
    const authors = ['mozilla', 'johnedoe'];
    const { slug } = fakeAddon;
    const state = sagaTester.getState();

    mockApi
      .expects('search')
      .withArgs({
        api: state.api,
        filters: {
          addonType: ADDON_TYPE_THEME,
          author: authors.join(','),
          exclude_addons: slug,
          page_size: OTHER_ADDONS_BY_AUTHORS_PAGE_SIZE,
          sort: SEARCH_SORT_TRENDING,
        },
      })
      .once()
      .returns(Promise.resolve(createAddonsApiResult(addons)));

    _fetchOtherAddonsByAuthors({ authors, slug });

    const expectedLoadAction = loadOtherAddonsByAuthors({ addons, slug });

    await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);
  });
});
