import {
  REDUX_CONNECT_END_GLOBAL_LOAD,
  REDUX_CONNECT_LOAD_FAIL,
} from 'core/constants';

export const initialState = {
  clearOnNext: false,
  error: null,
  hasError: false,
  statusCode: null,
};

export default function errorPage(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case REDUX_CONNECT_END_GLOBAL_LOAD:
      if (state.clearOnNext) {
        return initialState;
      }
      return { ...state, clearOnNext: true };
    case REDUX_CONNECT_LOAD_FAIL: {
      // Default to a 500 error if we don't have a status code from our
      // response. See:
      // github.com/mozilla/addons-frontend/pull/1685#discussion_r99243105
      let statusCode = 500;
      if (payload.error && payload.error.response &&
        payload.error.response.status
      ) {
        statusCode = payload.error.response.status;
      }

      return {
        ...state,
        error: payload.error,
        hasError: true,
        statusCode,
      };
    }
    default:
      return state;
  }
}
