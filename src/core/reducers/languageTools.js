/* @flow */
import { selectLocalizedContent } from 'core/reducers/utils';
import type { AppState } from 'amo/store';
import type {
  ExternalLanguageToolType,
  LanguageToolType,
} from 'core/types/addons';

export const FETCH_LANGUAGE_TOOLS: 'FETCH_LANGUAGE_TOOLS' =
  'FETCH_LANGUAGE_TOOLS';
export const LOAD_LANGUAGE_TOOLS: 'LOAD_LANGUAGE_TOOLS' = 'LOAD_LANGUAGE_TOOLS';

export type LanguageToolsState = {|
  byID: { [id: string]: LanguageToolType },
|};

export const initialState: LanguageToolsState = {
  byID: {},
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
}: FetchLanguageToolsParams = {}): FetchLanguageToolsAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }

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
}: LoadLanguageToolsParams = {}): LoadLanguageToolsAction => {
  if (!languageTools) {
    throw new Error('languageTools are required');
  }

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
  state: LanguageToolsState = initialState,
  action: Action,
): LanguageToolsState {
  switch (action.type) {
    case LOAD_LANGUAGE_TOOLS: {
      const byID = { ...state.byID };

      action.payload.languageTools.forEach((item) => {
        byID[`${item.id}`] = createInternalLanguageTool(
          item,
          item.target_locale,
        );
      });

      return {
        ...state,
        byID,
      };
    }
    default:
      return state;
  }
}
