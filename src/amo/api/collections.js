/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


type GetCollectionParams = {|
  api: ApiStateType,
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
