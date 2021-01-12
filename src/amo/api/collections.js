/* @flow */
import invariant from 'invariant';

import { callApi, allPages, validateLocalizedString } from 'amo/api';
import type {
  CollectionFilters,
  ExternalCollectionAddon,
  ExternalCollectionDetail,
} from 'amo/reducers/collections';
import type { ApiState } from 'amo/reducers/api';
import type { LocalizedString, PaginatedApiResponse } from 'amo/types/api';

export type GetCollectionParams = {|
  api: ApiState,
  slug: string,
  userId: string,
|};

export const getCollectionDetail = ({
  api,
  slug,
  userId,
}: GetCollectionParams): Promise<ExternalCollectionDetail> => {
  invariant(slug, 'slug is required');
  invariant(userId, 'userId is required');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${userId}/collections/${slug}`,
    apiState: api,
  });
};

export type GetCollectionAddonsParams = {|
  ...GetCollectionParams,
  nextURL?: string,
  filters?: CollectionFilters,
|};

export const getCollectionAddons = ({
  api,
  filters,
  nextURL,
  slug,
  userId,
}: GetCollectionAddonsParams): Promise<
  PaginatedApiResponse<ExternalCollectionAddon>,
> => {
  invariant(slug, 'slug is required');
  invariant(userId, 'userId is required');

  const request = {
    auth: true,
    endpoint:
      nextURL || `accounts/account/${userId}/collections/${slug}/addons`,
    params: undefined,
    apiState: api,
  };
  // If filters are requested explicitly, pass them to callApi().
  // By default, this code does not define request.params because doing so
  // would overwrite any query string params in nextURL.
  if (filters) {
    request.params = { page: filters.page, sort: filters.collectionSort };
  }

  return callApi(request);
};

type GetAllCollectionAddonsParams = {|
  ...GetCollectionParams,
  _allPages?: typeof allPages,
  _getCollectionAddons?: typeof getCollectionAddons,
|};

export const getAllCollectionAddons = async ({
  api,
  slug,
  userId,
  _allPages = allPages,
  _getCollectionAddons = getCollectionAddons,
}: GetAllCollectionAddonsParams): Promise<Array<ExternalCollectionAddon>> => {
  const { results } = await _allPages((nextURL) =>
    _getCollectionAddons({ api, nextURL, slug, userId }),
  );
  return results;
};

type ListCollectionsParams = {|
  api: ApiState,
  nextURL?: string,
  userId: string,
|};

export const listCollections = ({
  api,
  nextURL,
  userId,
}: ListCollectionsParams): Promise<
  PaginatedApiResponse<ExternalCollectionDetail>,
> => {
  invariant(userId, 'userId is required');

  const endpoint = nextURL || `accounts/account/${userId}/collections`;

  return callApi({ auth: true, endpoint, apiState: api });
};

export type GetAllUserCollectionsParams = {|
  ...ListCollectionsParams,
  _allPages?: typeof allPages,
  _listCollections?: typeof listCollections,
|};

export const getAllUserCollections = async ({
  api,
  userId,
  _allPages = allPages,
  _listCollections = listCollections,
}: GetAllUserCollectionsParams): Promise<Array<ExternalCollectionDetail>> => {
  const { results } = await _allPages((nextURL) =>
    _listCollections({ api, nextURL, userId }),
  );
  return results;
};

type ModifyCollectionParams = {|
  api: ApiState,
  defaultLocale: ?string,
  description: ?LocalizedString,
  // Even though the API accepts string|number, we need to always use
  // string user IDs. This helps keep public-facing URLs consistent.
  userId: string,
  // eslint-disable-next-line no-use-before-define
  _modifyCollection?: typeof modifyCollection,
  _validateLocalizedString?: typeof validateLocalizedString,
|};

export type UpdateCollectionParams = {|
  ...ModifyCollectionParams,
  // We identify the collection by its slug. This is confusing because the
  // slug can also be edited.
  // TODO: use the actual ID instead.
  // See https://github.com/mozilla/addons-server/issues/7529
  collectionSlug: string,
  name: ?LocalizedString,
  // This is a value for a new slug, if defined.
  slug: ?string,
|};

export type CreateCollectionParams = {|
  ...ModifyCollectionParams,
  name: LocalizedString,
  slug: string,
|};

export const modifyCollection = (
  action: 'create' | 'update',
  params: {
    ...ModifyCollectionParams,
    collectionSlug?: string,
    name?: ?LocalizedString,
    slug?: ?string,
  },
): Promise<void> => {
  const {
    api,
    collectionSlug = '',
    defaultLocale,
    description,
    name,
    slug,
    userId,
    _validateLocalizedString = validateLocalizedString,
  } = params;

  const creating = action === 'create';

  invariant(api, 'api is required');
  invariant(userId, 'userId is required');

  if (creating) {
    invariant(slug, 'The slug parameter is required when creating');
  } else {
    invariant(
      collectionSlug,
      'The collectionSlug parameter is required when updating',
    );
  }

  if (description) {
    _validateLocalizedString(description);
  }
  if (name) {
    _validateLocalizedString(name);
  }

  return callApi({
    auth: true,
    body: {
      default_locale: defaultLocale,
      description,
      name,
      slug,
      // The public=true|false flag is not sent to the API. This is
      // because collections are always public. Omitting this parameter
      // should cut down on unexpected bugs.
    },
    endpoint: `accounts/account/${userId}/collections/${
      creating ? '' : collectionSlug
    }`,
    method: creating ? 'POST' : 'PATCH',
    apiState: api,
  });
};

export const updateCollection = ({
  api,
  collectionSlug,
  defaultLocale,
  description,
  name,
  slug,
  userId,
  _modifyCollection = modifyCollection,
  _validateLocalizedString = validateLocalizedString,
}: UpdateCollectionParams): Promise<void> => {
  return _modifyCollection('update', {
    api,
    collectionSlug,
    defaultLocale,
    description,
    name,
    slug,
    userId,
    _validateLocalizedString,
  });
};

export const createCollection = ({
  api,
  defaultLocale,
  description,
  name,
  slug,
  userId,
  _modifyCollection = modifyCollection,
  _validateLocalizedString = validateLocalizedString,
}: CreateCollectionParams): Promise<void> => {
  return _modifyCollection('create', {
    api,
    defaultLocale,
    description,
    name,
    slug,
    userId,
    _validateLocalizedString,
  });
};

type ModifyCollectionAddonBaseParams = {|
  addonId: number,
  api: ApiState,
  slug: string,
  userId: string,
  _modifyCollectionAddon?: (any) => Promise<void>,
|};

type CollectionAddonNotes = LocalizedString | null;

export type CreateCollectionAddonParams = {|
  ...ModifyCollectionAddonBaseParams,
  notes?: CollectionAddonNotes,
|};

export type UpdateCollectionAddonParams = {|
  ...ModifyCollectionAddonBaseParams,
  notes: CollectionAddonNotes,
|};

type ModifyCollectionAddonParams =
  | {| action: 'create', ...CreateCollectionAddonParams |}
  | {| action: 'update', ...UpdateCollectionAddonParams |};

export const modifyCollectionAddon = (
  params: ModifyCollectionAddonParams,
): Promise<void> => {
  const { action, addonId, api, slug, userId } = params;

  invariant(action, 'The action parameter is required');
  invariant(addonId, 'The addonId parameter is required');
  invariant(api, 'The api parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(userId, 'The userId parameter is required');

  let method = 'POST';
  const body = { addon: addonId, notes: params.notes };
  let endpoint = `accounts/account/${userId}/collections/${slug}/addons`;

  if (action === 'update') {
    // TODO: once `notes` can be null, we can check for `undefined` values
    // to make sure that the caller didn't forget to set `notes`.
    // See https://github.com/mozilla/addons-server/issues/7832
    method = 'PATCH';
    delete body.addon;
    endpoint = `${endpoint}/${addonId}`;
  }

  return callApi({ auth: true, body, endpoint, method, apiState: api });
};

export const createCollectionAddon = ({
  addonId,
  api,
  slug,
  notes,
  userId,
  _modifyCollectionAddon = modifyCollectionAddon,
}: CreateCollectionAddonParams): Promise<void> => {
  return _modifyCollectionAddon({
    action: 'create',
    addonId,
    api,
    notes,
    slug,
    userId,
  });
};

export const updateCollectionAddon = ({
  addonId,
  api,
  slug,
  notes,
  userId,
  _modifyCollectionAddon = modifyCollectionAddon,
}: UpdateCollectionAddonParams): Promise<void> => {
  return _modifyCollectionAddon({
    action: 'update',
    addonId,
    api,
    notes,
    slug,
    userId,
  });
};

export type RemoveAddonFromCollectionParams = {|
  addonId: number,
  api: ApiState,
  slug: string,
  userId: string,
|};

export const removeAddonFromCollection = ({
  addonId,
  api,
  slug,
  userId,
}: RemoveAddonFromCollectionParams): Promise<void> => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(api, 'The api parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(userId, 'The userId parameter is required');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${userId}/collections/${slug}/addons/${addonId}`,
    method: 'DELETE',
    apiState: api,
  });
};

export type DeleteCollectionParams = {|
  api: ApiState,
  slug: string,
  userId: string,
|};

export const deleteCollection = ({
  api,
  slug,
  userId,
}: DeleteCollectionParams): Promise<void> => {
  invariant(api, 'The api parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(userId, 'The userId parameter is required');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${userId}/collections/${slug}`,
    method: 'DELETE',
    apiState: api,
  });
};
