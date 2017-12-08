/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


type GetCollectionParams = {|
  api: ApiStateType,
  // TODO: rename slug to `collection` so it can be ID or slug.
  slug: string,
  user: string | number,
|};

export const getCollectionDetail = (
  { api, slug, user }: GetCollectionParams
) => {
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
) => {
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
  user: string | number,
|};

export const listCollections = (
  { api, user }: ListCollectionsParams
) => {
  if (!user) {
    throw new Error('The user parameter is required');
  }

  return callApi({
    auth: true,
    endpoint: `accounts/account/${user}/collections`,
    state: api,
  });
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
) => {
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
