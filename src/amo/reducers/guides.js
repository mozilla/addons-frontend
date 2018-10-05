/* @flow */

export const FETCH_GUIDE_TEXT: 'FETCH_GUIDE_TEXT' = 'FETCH_GUIDE_TEXT';
export const SET_GUIDE_TEXT: 'SET_GUIDE_TEXT' = 'SET_GUIDE_TEXT';

export type GuideTextType = {|
  text: string | void,
|};

export type FetchGuideParams = {|
  guideSlug: string,
  errorHandlerId: string,
|};

export type FetchGuideActionType = {|
  type: typeof FETCH_GUIDE_TEXT,
  payload: {|
    errorHandlerId: string,
    guideSlug: string,
  |},
|};

export type SetGuideActionType = {|
  type: typeof SET_GUIDE_TEXT,
  payload: GuideTextType,
|};

export const initialState: GuideTextType = {
  text: undefined,
};

export const setGuideText = ({ text }: GuideTextType): SetGuideActionType => {
  return {
    type: SET_GUIDE_TEXT,
    payload: { text },
  };
};

export const fetchGuideText = ({
  guideSlug,
  errorHandlerId,
}: FetchGuideParams): FetchGuideActionType => {
  return {
    type: FETCH_GUIDE_TEXT,
    payload: { guideSlug, errorHandlerId },
  };
};

export default function reducer(
  state: GuideTextType = initialState,
  action: SetGuideActionType,
): GuideTextType {
  switch (action.type) {
    case SET_GUIDE_TEXT:
      return {
        ...state,
        text: action.payload.text,
      };
    default:
      return state;
  }
}
