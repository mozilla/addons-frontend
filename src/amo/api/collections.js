/* @flow */
import { callApi, allPages, validateLocalizedString } from 'core/api';
import type {
  ExternalCollectionAddon,
  ExternalCollectionDetail,
} from 'amo/reducers/collections';
import type { ApiStateType } from 'core/reducers/api';
import type {
  LocalizedString, PaginatedApiResponse,
} from 'core/types/api';


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

type GetAllUserCollectionsParams = {|
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

type UpdateCollectionParams = {|
  api: ApiStateType,
  collectionSlug: string,
  defaultLocale?: string,
  description?: LocalizedString,
  isPublic?: boolean,
  name?: LocalizedString,
  slug?: string,
  user: string | number,
  _validateLocalizedString?: typeof validateLocalizedString,
|};

export const updateCollection = ({
  api,
  collectionSlug,
  defaultLocale,
  description,
  isPublic,
  name,
  slug,
  user,
  _validateLocalizedString = validateLocalizedString,
}: UpdateCollectionParams): Promise<void> => {
  if (!api) {
    throw new Error('The api parameter cannot be empty');
  }
  if (!collectionSlug) {
    throw new Error('The collectionSlug parameter cannot be empty');
  }
  if (!user) {
    throw new Error('The user parameter cannot be empty');
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
      public: isPublic,
      slug,
    },
    endpoint: `accounts/account/${user}/collections/${collectionSlug}`,
    method: 'PATCH',
    state: api,
  });
};
