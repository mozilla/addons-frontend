import {
  VERSION_GET,
  VERSION_LOADED,
  VERSION_FAILED,
} from 'core/constants';

const initialState = {
  loading: false,
};

export default function version(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case VERSION_GET:
      return { ...state, ...payload, loading: true };
    case VERSION_LOADED:
      return { ...state, ...payload.result, loading: false };
    case VERSION_FAILED:
      return {
        ...initialState,
        error: true,
      };
    default:
      return state;
  }
}
