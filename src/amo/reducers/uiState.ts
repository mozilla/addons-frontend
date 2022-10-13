import invariant from 'invariant';

export const SET_UI_STATE = 'SET_UI_STATE';
export type UIStateState = Record<string, Record<string, any>>;
const initialState = {};
export const selectUIState = ({
  uiState,
  uiStateID,
}: {
  uiState: UIStateState;
  uiStateID: string;
}): Record<string, any> => {
  return uiState[uiStateID];
};
type SetUIStateParams = {
  id: string;
  change: Record<string, any>;
};
type SetUIStateAction = {
  payload: SetUIStateParams;
  type: typeof SET_UI_STATE;
};
export const setUIState = ({
  change,
  id,
}: SetUIStateParams): SetUIStateAction => {
  invariant(change, 'change cannot be undefined');
  invariant(id, 'id cannot be undefined');
  return {
    type: SET_UI_STATE,
    payload: {
      change,
      id,
    },
  };
};
type UIStateActions = SetUIStateAction;
export default function uiStateReducer(state: UIStateState = initialState, action: UIStateActions): UIStateState {
  switch (action.type) {
    case SET_UI_STATE:
      {
        const {
          change,
          id,
        } = action.payload;
        return { ...state,
          [id]: { ...state[id],
            ...change,
          },
        };
      }

    default:
      return state;
  }
}