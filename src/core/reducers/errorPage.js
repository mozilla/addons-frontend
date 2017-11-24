import { LOCATION_CHANGE } from 'react-router-redux';

const LOAD_ERROR_PAGE = 'LOAD_ERROR_PAGE';

export const initialState = {
  clearOnNext: false,
  error: null,
  hasError: false,
  statusCode: null,
};

export const loadErrorPage = ({ error } = {}) => {
  if (!error) {
    throw new Error('error is required');
  }

  return {
    type: LOAD_ERROR_PAGE,
    payload: { error },
  };
};

export default function errorPage(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case LOCATION_CHANGE: {
      if (state.clearOnNext) {
        return initialState;
      }

      return {
        ...state,
        clearOnNext: true,
      };
    }
    case LOAD_ERROR_PAGE: {
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
