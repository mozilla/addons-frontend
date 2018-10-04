/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';
import type { PaginatedApiResponse } from 'core/types/api';
import type { ExternalAddonVersionType } from 'core/types/addons';

export type GetVersionsParams = {|
  api: ApiState,
  page?: string,
  slug: string,
|};

export const getVersions = ({
  api,
  slug,
  ...params
}: GetVersionsParams = {}): Promise<
  PaginatedApiResponse<ExternalAddonVersionType>,
> => {
  invariant(slug, 'slug is required');

  return callApi({
    apiState: api,
    auth: true,
    endpoint: `addons/addon/${slug}/versions/`,
    params,
  });
};
