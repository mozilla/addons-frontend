/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';
import type { ExternalSiteStatus } from 'core/reducers/site';

export type GetSiteStatusParams = {
  api: ApiState,
};

export const getSiteStatus = ({
  api,
}: GetSiteStatusParams): Promise<ExternalSiteStatus> => {
  invariant(api, 'api state is required.');

  return callApi({ endpoint: 'site', apiState: api });
};
