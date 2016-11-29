import { SET_ERROR } from 'core/constants';

const initialState = {};

export default function errors(state = initialState, action) {
  switch (action.type) {
    case SET_ERROR: {
      let errorData = null;
      if (action.payload.error) {
        errorData = {
          error: {
            messages: action.payload.messages,
            error: action.payload.error,
          },
        };
      }
      return {
        ...state,
        [action.payload.id]: errorData,
      };
    }
    default:
      return state;
  }
}
