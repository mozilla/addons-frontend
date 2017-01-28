// import { LOG_OUT_USER } from 'core/constants';

export default function showError(state = {}, action) {
  const { payload } = action;
  switch (action.type) {
    case 'SET_ERROR_PAGE':
      // console.log('SET_ERROR', state);

      return { ...state, errorPage: payload };
    case '@@router/LOCATION_CHANGE':
      return { ...state, errorPage: false };
    default:
      return state;
  }
}
