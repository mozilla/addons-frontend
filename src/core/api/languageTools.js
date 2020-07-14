/* @flow */
import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';

export type LanguageToolsParams = {|
  api: ApiState,
|};

export function languageTools({ api }: LanguageToolsParams) {
  return callApi({
    auth: true,
    endpoint: 'addons/language-tools',
    method: 'GET',
    params: { app: api.clientApp },
    apiState: api,
  });
}
