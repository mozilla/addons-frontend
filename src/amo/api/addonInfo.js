/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';

export type GetAddonInfoParams = {|
  api: ApiState,
  slug: string,
|};

export type ExternalAddonInfoType = {|
  eula: string,
  privacy_policy: string,
|};

export const getAddonInfo = ({ api, slug }: GetAddonInfoParams = {}): Promise<
  ExternalAddonInfoType,
> => {
  invariant(slug, 'slug is required');

  return callApi({
    apiState: api,
    auth: true,
    endpoint: `addons/addon/${slug}/eula_policy/`,
  });
};
