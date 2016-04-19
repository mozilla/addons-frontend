export default function api(state = {}, action) {
  switch (action.type) {
    case 'SET_JWT':
      return {...state, token: action.payload.token};
    default:
      return state;
  }
}
