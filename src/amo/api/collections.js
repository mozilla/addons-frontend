/* @flow */
import invariant from 'invariant';

import { callApi, allPages, validateLocalizedString } from 'core/api';
import type {
  ExternalCollectionAddon,
  ExternalCollectionDetail,
} from 'amo/reducers/collections';
import type { ApiStateType } from 'core/reducers/api';
import type {
  LocalizedString, PaginatedApiResponse,
} from 'core/types/api';


export type GetCollectionParams = {|
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

export type GetCollectionAddonsParams = {|
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
  // If a page is requested explicitly, pass it to callApi().
  // By default, this code does not define request.params because doing so
  // would overwrite any query string params in nextURL.
  if (page) {
    request.params = { page };
  }

  return callApi(request);
};

type GetAllCollectionAddonsParams = {|
  ...GetCollectionParams,
  _allPages?: typeof allPages,
  _getCollectionAddons?: typeof getCollectionAddons,
|};

export const getAllCollectionAddons = async (
  {
    api,
    slug,
    user,
    _allPages = allPages,
    _getCollectionAddons = getCollectionAddons,
  }: GetAllCollectionAddonsParams
): Promise<Array<ExternalCollectionAddon>> => {
  const { results } = await _allPages(
    (nextURL) => _getCollectionAddons({ api, nextURL, slug, user })
  );
  return results;
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

export type GetAllUserCollectionsParams = {|
  ...ListCollectionsParams,
  _allPages?: typeof allPages,
  _listCollections?: typeof listCollections,
|};

export const getAllUserCollections = async (
  {
    api,
    user,
    _allPages = allPages,
    _listCollections = listCollections,
  }: GetAllUserCollectionsParams
): Promise<Array<ExternalCollectionDetail>> => {
  const { results } = await _allPages(
    (nextURL) => _listCollections({ api, nextURL, user })
  );
  return results;
};

type ModifyCollectionParams = {|
  api: ApiStateType,
  defaultLocale: ?string,
  description: ?LocalizedString,
  // Even though the API accepts string|number, we need to always use
  // string usernames. This helps keep public-facing URLs consistent.
  user: string,
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
  }
): Promise<void> => {
  const {
    api,
    collectionSlug = '',
    defaultLocale,
    description,
    name,
    slug,
    user,
    _validateLocalizedString = validateLocalizedString,
  } = params;

  const creating = action === 'create';

  invariant(api, 'The api parameter is required');
  invariant(user, 'The user parameter is required');
  if (creating) {
    invariant(slug, 'The slug parameter is required when creating');
  } else {
    invariant(collectionSlug,
      'The collectionSlug parameter is required when updating');
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
    endpoint:
      `accounts/account/${user}/collections/${creating ? '' : collectionSlug}`,
    method: creating ? 'POST' : 'PATCH',
    state: api,
  });
};

export const updateCollection = ({
  api,
  collectionSlug,
  defaultLocale,
  description,
  name,
  slug,
  user,
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
    user,
    _validateLocalizedString,
  });
};

export const createCollection = ({
  api,
  defaultLocale,
  description,
  name,
  slug,
  user,
  _modifyCollection = modifyCollection,
  _validateLocalizedString = validateLocalizedString,
}: CreateCollectionParams): Promise<void> => {
  return _modifyCollection('create', {
    api,
    defaultLocale,
    description,
    name,
    slug,
    user,
    _validateLocalizedString,
  });
};

type ModifyCollectionAddonBaseParams = {|
  addonId: number,
  api: ApiStateType,
  collectionSlug: string,
  user: string | number,
  _modifyCollectionAddon?: (any) => Promise<void>,
|};

type CollectionAddonNotes = string | null;

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
  const { action, addonId, api, collectionSlug, user } = params;

  invariant(action, 'The action parameter is required');
  invariant(addonId, 'The addonId parameter is required');
  invariant(api, 'The api parameter is required');
  invariant(collectionSlug, 'The collectionSlug parameter is required');
  invariant(user, 'The user parameter is required');

  let method = 'POST';
  const body = { addon: addonId, notes: params.notes };
  let endpoint =
    `accounts/account/${user}/collections/${collectionSlug}/addons`;

  if (action === 'update') {
    // TODO: once `notes` can be null, we can check for `undefined` values
    // to make sure that the caller didn't forget to set `notes`.
    // See https://github.com/mozilla/addons-server/issues/7832
    method = 'PATCH';
    delete body.addon;
    endpoint = `${endpoint}/${addonId}`;
  }

  return callApi({ auth: true, body, endpoint, method, state: api });
};

export const createCollectionAddon = ({
  addonId,
  api,
  collectionSlug,
  notes,
  user,
  _modifyCollectionAddon = modifyCollectionAddon,
}: CreateCollectionAddonParams): Promise<void> => {
  return _modifyCollectionAddon({
    action: 'create', addonId, api, collectionSlug, notes, user,
  });
};

export const updateCollectionAddon = ({
  addonId,
  api,
  collectionSlug,
  notes,
  user,
  _modifyCollectionAddon = modifyCollectionAddon,
}: UpdateCollectionAddonParams): Promise<void> => {
  return _modifyCollectionAddon({
    action: 'update', addonId, api, collectionSlug, notes, user,
  });
};
export type RemoveAddonFromCollectionParams = {|
  addonId: number,
  api: ApiStateType,
  slug: string,
  user: string | number,
|};

export const removeAddonFromCollection = (
  { addonId, api, slug, user }: RemoveAddonFromCollectionParams
): Promise<void> => {
  invariant(addonId, 'The addonId parameter is required');
  invariant(api, 'The api parameter is required');
  invariant(slug, 'The slug parameter is required');
  invariant(user, 'The user parameter is required');

  return callApi({
    auth: true,
    endpoint:
      `accounts/account/${user}/collections/${slug}/addons/${addonId}`,
    method: 'DELETE',
    state: api,
  });
};

