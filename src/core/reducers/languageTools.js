/* @flow */
import type { AppState } from 'amo/store';
import type { LanguageToolType } from 'core/types/addons';

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
  languageTools: Array<LanguageToolType>,
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

  return Object.values(byID);
};

type Action = FetchLanguageToolsAction | LoadLanguageToolsAction;

export default function languageToolsReducer(
  state: LanguageToolsState = initialState,
  action: Action,
): LanguageToolsState {
  switch (action.type) {
    case LOAD_LANGUAGE_TOOLS: {
      const byID = { ...state.byID };

      action.payload.languageTools.forEach((item) => {
        byID[`${item.id}`] = item;
      });

      return {
        byID,
      };
    }
    default:
      return state;
  }
}
