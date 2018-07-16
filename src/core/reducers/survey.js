/* @flow */
const DISMISS_SURVEY: 'DISMISS_SURVEY' = 'DISMISS_SURVEY';
const SHOW_SURVEY: 'SHOW_SURVEY' = 'SHOW_SURVEY';

export type SurveyState = {|
  wasDismissed: boolean,
|};

export const initialState = {
  wasDismissed: false,
};

type DismissSurveyAction = {|
  type: typeof DISMISS_SURVEY,
|};

export const dismissSurvey = (): DismissSurveyAction => {
  return { type: DISMISS_SURVEY };
};

type ShowSurveyAction = {|
  type: typeof SHOW_SURVEY,
|};

export const showSurvey = (): ShowSurveyAction => {
  return { type: SHOW_SURVEY };
};

type Action = DismissSurveyAction | ShowSurveyAction;

const surveyReducer = (
  state: SurveyState = initialState,
  action: Action,
): SurveyState => {
  switch (action.type) {
    case DISMISS_SURVEY:
      return { ...state, wasDismissed: true };
    case SHOW_SURVEY:
      return { ...state, wasDismissed: false };
    default:
      return state;
  }
};

export default surveyReducer;
