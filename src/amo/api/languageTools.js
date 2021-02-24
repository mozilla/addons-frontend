/* @flow */
import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { ExternalLanguageToolType } from 'amo/types/addons';

export type LanguageToolsParams = {|
  api: ApiState,
|};

export function languageTools({
  api,
}: LanguageToolsParams): Promise<Array<ExternalLanguageToolType>> {
  return callApi({
    auth: true,
    endpoint: 'addons/language-tools',
    method: 'GET',
    params: { app: api.clientApp },
    apiState: api,
  });
}
