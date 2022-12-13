/* @flow */
import invariant from 'invariant';

import { SET_LANG } from 'amo/reducers/api';
import { selectLocalizedContent } from 'amo/reducers/utils';
import type { AppState } from 'amo/store';
import type {
  ExternalLanguageToolType,
  LanguageToolType,
} from 'amo/types/addons';

export const FETCH_LANGUAGE_TOOLS: 'FETCH_LANGUAGE_TOOLS' =
  'FETCH_LANGUAGE_TOOLS';
export const LOAD_LANGUAGE_TOOLS: 'LOAD_LANGUAGE_TOOLS' = 'LOAD_LANGUAGE_TOOLS';

export type LanguageToolsState = {|
  byID: { [id: string]: LanguageToolType },
  lang: string,
|};

export const initialState: LanguageToolsState = {
  byID: {},
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
};

type FetchLanguageToolsParams = {|
  errorHandlerId: string,
|};

export type FetchLanguageToolsAction = {|
  type: typeof FETCH_LANGUAGE_TOOLS,
  payload: FetchLanguageToolsParams,
|};

export const fetchLanguageTools = ({
  errorHandlerId,
}: FetchLanguageToolsParams): FetchLanguageToolsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: FETCH_LANGUAGE_TOOLS,
    payload: { errorHandlerId },
  };
};

type LoadLanguageToolsParams = {|
  languageTools: Array<ExternalLanguageToolType>,
|};

type LoadLanguageToolsAction = {|
  type: typeof LOAD_LANGUAGE_TOOLS,
  payload: LoadLanguageToolsParams,
|};

export const loadLanguageTools = ({
  languageTools,
}: LoadLanguageToolsParams): LoadLanguageToolsAction => {
  invariant(languageTools, 'languageTools are required');

  return {
    type: LOAD_LANGUAGE_TOOLS,
    payload: { languageTools },
  };
};

export const getAllLanguageTools = (
  state: AppState,
): Array<LanguageToolType> => {
  const { byID } = state.languageTools;

  // TODO: one day, Flow will get `Object.values()` right but for now... we
  // have to deal with it.
  // See: https://github.com/facebook/flow/issues/2221.
  return Object.keys(byID).map((key) => byID[key]);
};

export const createInternalLanguageTool = (
  languageTool: ExternalLanguageToolType,
  lang: string,
): LanguageToolType => ({
  ...languageTool,
  name: selectLocalizedContent(languageTool.name, lang),
});

type Action = FetchLanguageToolsAction | LoadLanguageToolsAction;

export default function languageToolsReducer(
  // eslint-disable-next-line default-param-last
  state: LanguageToolsState = initialState,
  action: Action,
): LanguageToolsState {
  switch (action.type) {
    case LOAD_LANGUAGE_TOOLS: {
      const byID = { ...state.byID };

      action.payload.languageTools.forEach((item) => {
        byID[`${item.id}`] = createInternalLanguageTool(item, state.lang);
      });

      return {
        ...state,
        byID,
      };
    }
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };
    default:
      return state;
  }
}
