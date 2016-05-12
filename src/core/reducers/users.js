export default function users(state = {}, { payload = {} }) {
  if (payload.entities && payload.entities.users) {
    return {...state, ...payload.entities.users};
  }
  return state;
}
