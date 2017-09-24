/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export type LanguageToolsParams = {|
  api: ApiStateType,
|};

export function languageTools({ api }: LanguageToolsParams) {
  return callApi({
    endpoint: 'addons/language-tools',
    method: 'GET',
    state: api,
  });
}
