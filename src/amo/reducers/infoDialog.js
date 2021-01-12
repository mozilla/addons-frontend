/* @flow */
export const CLOSE_INFO: 'CLOSE_INFO' = 'CLOSE_INFO';
export const SHOW_INFO: 'SHOW_INFO' = 'SHOW_INFO';

type InfoDialogData = {|
  addonName: string,
  imageURL: string,
|};

export type InfoDialogState = {|
  data: InfoDialogData | null,
  show: boolean,
|};

export const initialState: InfoDialogState = {
  data: null,
  show: false,
};

type ShowInfoDialogParams = InfoDialogData;

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
