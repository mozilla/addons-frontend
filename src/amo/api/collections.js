/* @flow */
/* eslint-disable no-await-in-loop */
import { oneLine } from 'common-tags';

import { callApi } from 'core/api';
import log from 'core/logger';
import type {
  ExternalCollectionAddon, ExternalCollectionDetail,
} from 'amo/reducers/collections';
import type { ApiStateType } from 'core/reducers/api';
import type { PaginatedApiResponse } from 'core/types/api';


type GetCollectionParams = {|
  api: ApiStateType,
  slug: string,
  user: string | number,
|};

export const getCollectionDetail = (
  { api, slug, user }: GetCollectionParams
): Promise<ExternalCollectionDetail> => {
  if (!slug) {
    throw new Error('slug is required');
  }
  if (!user) {
    throw new Error('user is required');
  }

  return callApi({
    auth: true,
    endpoint: `accounts/account/${user}/collections/${slug}`,
    state: api,
  });
};

type GetCollectionAddonsParams = {|
  ...GetCollectionParams,
  nextURL?: string,
  page?: number,
|};

export const getCollectionAddons = (
  { api, nextURL, page, slug, user }: GetCollectionAddonsParams
): Promise<PaginatedApiResponse<ExternalCollectionAddon>> => {
  if (!slug) {
    throw new Error('slug is required');
  }
  if (!user) {
    throw new Error('user is required');
  }

  const request = {
    auth: true,
    endpoint:
      nextURL || `accounts/account/${user}/collections/${slug}/addons`,
    params: undefined,
    state: api,
  };
  if (!nextURL || page) {
    request.params = { page };
  }

  return callApi(request);
};

export const getAllCollectionAddons = async (
  { api, slug, user }: GetCollectionParams
): Promise<Array<ExternalCollectionAddon>> => {
  let allResults = [];
  let done = false;
  let nextURL;

  // TODO: make a helper function for this pattern.
  while (!done) {
    const response = await getCollectionAddons({
      api, nextURL, slug, user,
    });
    allResults = allResults.concat(response.results);

    if (response.next) {
      nextURL = response.next;
      log.debug(oneLine`Fetching next page "${nextURL}" of
        getCollectionAddons for "${user}/${slug}"`);
    } else {
      done = true;
    }
  }

  return allResults;
};

type ListCollectionsParams = {|
  api: ApiStateType,
  nextURL?: string,
  user: string | number,
|};

export const listCollections = (
  { api, nextURL, user }: ListCollectionsParams
): Promise<PaginatedApiResponse<ExternalCollectionDetail>> => {
  if (!user) {
    throw new Error('The user parameter is required');
  }
  const endpoint = nextURL || `accounts/account/${user}/collections`;

  return callApi({ auth: true, endpoint, state: api });
};

export const getAllUserCollections = async (
  { api, user }: ListCollectionsParams
): Promise<Array<ExternalCollectionDetail>> => {
  let allResults = [];
  let done = false;
  let nextURL;

  while (!done) {
    const response = await listCollections({ api, user, nextURL });
    allResults = allResults.concat(response.results);

    if (response.next) {
      nextURL = response.next;
      log.debug(oneLine`Fetching next page "${nextURL}" of
        listCollections for user "${user}"`);
    } else {
      done = true;
    }
  }

  return allResults;
};

type GetAllUserAddonCollections = {|
  addonId: number,
  api: ApiStateType,
  user: string | number,
  _getAllCollectionAddons?: typeof getAllCollectionAddons,
  _getAllUserCollections?: typeof getAllUserCollections,
|};

export const getAllUserAddonCollections = async (
  {
    addonId,
    api,
    user,
    _getAllCollectionAddons = getAllCollectionAddons,
    _getAllUserCollections = getAllUserCollections,
  }: GetAllUserAddonCollections
): Promise<Array<ExternalCollectionDetail>> => {
  // TODO: ultimately, we should query a single API endpoint to
  // fetch all user collections that an add-on belongs to.
  // https://github.com/mozilla/addons-server/issues/7167

  // Fetch all collections belonging to the user.
  const collectionResults = await _getAllUserCollections({ api, user });

  // Accumulate a list of collections that the add-on belongs to.
  const matches = [];
  const requests = collectionResults.map((collection) => {
    return _getAllCollectionAddons({ api, slug: collection.slug, user })
      .then((results) => {
        if (results.some((result) => result.addon.id === addonId)) {
          matches.push(collection);
        }
      });
  });

  await Promise.all(requests);
  return matches;
};

type AddAddonToCollectionParams = {|
  addon: string | number,
  api: ApiStateType,
  collection: string | number,
  notes?: string,
  user: string | number,
|};

export const addAddonToCollection = (
  { addon, api, collection, notes, user }: AddAddonToCollectionParams
): Promise<void> => {
  if (!addon) {
    throw new Error('The addon parameter is required');
  }
  if (!collection) {
    throw new Error('The collection parameter is required');
  }
  if (!user) {
    throw new Error('The user parameter is required');
  }

  return callApi({
    auth: true,
    body: { addon, notes },
    endpoint: `accounts/account/${user}/collections/${collection}/addons`,
    method: 'POST',
    state: api,
  });
};
