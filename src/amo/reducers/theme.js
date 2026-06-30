/* @flow */
import { SET_THEME, THEME_AUTO, THEME_PREFERENCES } from 'amo/constants';

export type ThemePreference = typeof THEME_AUTO | 'light' | 'dark';

export type ThemeState = {|
  theme: ThemePreference,
|};

export type SetThemeAction = {|
  type: typeof SET_THEME,
  payload: {| theme: ThemePreference |},
|};

export const initialState: ThemeState = {
  theme: THEME_AUTO,
};

export function setTheme(theme: ThemePreference): SetThemeAction {
  if (!THEME_PREFERENCES.includes(theme)) {
    throw new Error(
      `theme must be one of ${THEME_PREFERENCES.join(', ')}; got "${theme}"`,
    );
  }

  return {
    type: SET_THEME,
    payload: { theme },
  };
}

export default function themeReducer(
  // eslint-disable-next-line default-param-last
  state: ThemeState = initialState,
  action: SetThemeAction,
): ThemeState {
  switch (action.type) {
    case SET_THEME:
      return { ...state, theme: action.payload.theme };

    default:
      return state;
  }
}
