/* @flow */
export const CLOSE_INFO: 'CLOSE_INFO' = 'CLOSE_INFO';
export const SHOW_INFO: 'SHOW_INFO' = 'SHOW_INFO';

export type InfoDialogState = {|
  data: Object,
  show: boolean,
|};

export const initialState: InfoDialogState = {
  data: {},
  show: false,
};

type ShowInfoDialogParams = Object;

type ShowInfoDialogAction = {|
  type: typeof SHOW_INFO,
  payload: ShowInfoDialogParams,
|};

export const showInfoDialog = (
  payload: ShowInfoDialogParams,
): ShowInfoDialogAction => {
  return { type: SHOW_INFO, payload };
};

type CloseInfoDialogAction = {|
  type: typeof CLOSE_INFO,
|};

export const closeInfoDialog = (): CloseInfoDialogAction => {
  return { type: CLOSE_INFO };
};

type Action = CloseInfoDialogAction | ShowInfoDialogAction;

export default function infoDialog(
  state: InfoDialogState = initialState,
  action: Action,
) {
  switch (action.type) {
    case SHOW_INFO:
      return {
        show: true,
        data: action.payload,
      };
    case CLOSE_INFO:
      return initialState;
    default:
      return state;
  }
}
