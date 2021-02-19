/* @flow */
export const OPEN_FORM_OVERLAY: 'OPEN_FORM_OVERLAY' = 'OPEN_FORM_OVERLAY';
export const CLOSE_FORM_OVERLAY: 'CLOSE_FORM_OVERLAY' = 'CLOSE_FORM_OVERLAY';
export const BEGIN_FORM_OVERLAY_SUBMIT: 'BEGIN_FORM_OVERLAY_SUBMIT' =
  'BEGIN_FORM_OVERLAY_SUBMIT';
export const FINISH_FORM_OVERLAY_SUBMIT: 'FINISH_FORM_OVERLAY_SUBMIT' =
  'FINISH_FORM_OVERLAY_SUBMIT';

export type FormOverlayState = {
  [formOverlayId: string]: {|
    open: boolean,
    submitting: boolean,
  |},
};

export const initialState: FormOverlayState = {};

type FormOverlayPayload = {| id: string |};

type OpenFormOverlayAction = {|
  payload: FormOverlayPayload,
  type: typeof OPEN_FORM_OVERLAY,
|};

export const openFormOverlay = (id: string): OpenFormOverlayAction => {
  if (!id) {
    throw new Error('The id parameter is required');
  }

  return {
    payload: { id },
    type: OPEN_FORM_OVERLAY,
  };
};

type CloseFormOverlayAction = {|
  payload: FormOverlayPayload,
  type: typeof CLOSE_FORM_OVERLAY,
|};

export const closeFormOverlay = (id: string): CloseFormOverlayAction => {
  if (!id) {
    throw new Error('The id parameter is required');
  }

  return {
    payload: { id },
    type: CLOSE_FORM_OVERLAY,
  };
};

type BeginFormOverlaySubmitAction = {|
  payload: FormOverlayPayload,
  type: typeof BEGIN_FORM_OVERLAY_SUBMIT,
|};

export const beginFormOverlaySubmit = (
  id: string,
): BeginFormOverlaySubmitAction => {
  if (!id) {
    throw new Error('The id parameter is required');
  }

  return {
    payload: { id },
    type: BEGIN_FORM_OVERLAY_SUBMIT,
  };
};

type FinishFormOverlaySubmitAction = {|
  payload: FormOverlayPayload,
  type: typeof FINISH_FORM_OVERLAY_SUBMIT,
|};

export const finishFormOverlaySubmit = (
  id: string,
): FinishFormOverlaySubmitAction => {
  if (!id) {
    throw new Error('The id parameter is required');
  }

  return {
    payload: { id },
    type: FINISH_FORM_OVERLAY_SUBMIT,
  };
};

type Action =
  | BeginFormOverlaySubmitAction
  | CloseFormOverlayAction
  | FinishFormOverlaySubmitAction
  | OpenFormOverlayAction;

const reducer = (
  state: FormOverlayState = initialState,
  action: Action,
): FormOverlayState => {
  switch (action.type) {
    case OPEN_FORM_OVERLAY: {
      const { id } = action.payload;
      return {
        ...state,
        [id]: {
          ...state[id],
          open: true,
        },
      };
    }
    case CLOSE_FORM_OVERLAY: {
      const { id } = action.payload;
      return {
        ...state,
        [id]: {
          ...state[id],
          open: false,
        },
      };
    }
    case BEGIN_FORM_OVERLAY_SUBMIT: {
      const { id } = action.payload;
      return {
        ...state,
        [id]: {
          ...state[id],
          submitting: true,
        },
      };
    }
    case FINISH_FORM_OVERLAY_SUBMIT: {
      const { id } = action.payload;
      return {
        ...state,
        [id]: {
          ...state[id],
          submitting: false,
        },
      };
    }
    default:
      return state;
  }
};

export default reducer;
