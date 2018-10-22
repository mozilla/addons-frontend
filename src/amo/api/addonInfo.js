/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';

export type GetAddonInfoParams = {|
  api: ApiState,
  slug: string,
|};

export type ExternalAddonInfoType = {|
  eula: string | null,
  privacyPolicy: string | null,
|};

export const getAddonInfo = async ({
  api,
  slug,
}: GetAddonInfoParams = {}): Promise<ExternalAddonInfoType | null> => {
  invariant(slug, 'slug is required');

  const response = await callApi({
    apiState: api,
    auth: true,
    endpoint: `addons/addon/${slug}/eula_policy/`,
  });
  return {
    eula: response ? response.eula : null,
    privacyPolicy: response ? response.privacy_policy : null,
  };
};
