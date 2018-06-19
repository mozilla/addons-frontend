/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';

export type LanguageToolsParams = {|
  api: ApiStateType,
|};

export function languageTools({ api }: LanguageToolsParams) {
  return callApi({
    auth: true,
    endpoint: 'addons/language-tools',
    method: 'GET',
    params: { app: api.clientApp },
    state: api,
  });
}
