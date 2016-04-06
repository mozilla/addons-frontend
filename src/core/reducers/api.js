import ApiClient from 'core/api';

export default function api(state = null, action) {
  if (action.type === 'SET_API_CLIENT') {
    return new ApiClient({getState: action.payload.getState});
  }
  return state;
}
