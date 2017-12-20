/* @flow */
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
  page?: number,
|};

export const getCollectionAddons = (
  { api, page, slug, user }: GetCollectionAddonsParams
): Promise<PaginatedApiResponse<ExternalCollectionAddon>> => {
  if (!slug) {
    throw new Error('slug is required');
  }
  if (!user) {
    throw new Error('user is required');
  }

  return callApi({
    auth: true,
    endpoint: `accounts/account/${user}/collections/${slug}/addons`,
    params: { page },
    state: api,
  });
};

type ListCollectionsParams = {|
  api: ApiStateType,
  nextPage?: string,
  user: string | number,
|};

export const listCollections = (
  { api, nextPage, user }: ListCollectionsParams
): Promise<PaginatedApiResponse<ExternalCollectionDetail>> => {
  if (!user) {
    throw new Error('The user parameter is required');
  }
  const endpoint = nextPage || `accounts/account/${user}/collections`;

  return callApi({ auth: true, endpoint, state: api });
};

export const getAllUserCollections = async (
  { api, user }: ListCollectionsParams
): Promise<Array<ExternalCollectionDetail>> => {
  let allResults = [];
  let done = false;
  let nextPage;

  while (!done) {
    // eslint thinks we can do all requests in parallel; we cannot.
    // eslint-disable-next-line no-await-in-loop
    const response = await listCollections({
      api, user, nextPage,
    });
    allResults = allResults.concat(response.results);

    if (response.next) {
      nextPage = response.next;
      log.debug(oneLine`Fetching next page "${nextPage}" of
        listCollections for user "${user}"`);
    } else {
      done = true;
    }
  }

  return allResults;
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
