export default function i18n(state = {}, action) {
  if (action.type === 'SET_I18N') {
    return action.payload;
  }
  return state;
}
