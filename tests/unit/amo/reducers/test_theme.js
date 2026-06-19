import themeReducer, { initialState, setTheme } from 'amo/reducers/theme';
import { THEME_AUTO, THEME_DARK, THEME_LIGHT } from 'amo/constants';

describe(__filename, () => {
  it('defaults to the automatic theme', () => {
    const state = themeReducer(undefined, {});

    expect(state).toEqual({ theme: THEME_AUTO });
  });

  it.each([THEME_AUTO, THEME_LIGHT, THEME_DARK])(
    'sets the theme to %s',
    (theme) => {
      const state = themeReducer(initialState, setTheme(theme));

      expect(state.theme).toEqual(theme);
    },
  );

  it('overwrites a previously set theme', () => {
    let state = themeReducer(initialState, setTheme(THEME_DARK));
    state = themeReducer(state, setTheme(THEME_LIGHT));

    expect(state.theme).toEqual(THEME_LIGHT);
  });

  it('ignores unrelated actions', () => {
    const state = themeReducer(
      { theme: THEME_DARK },
      { type: 'SOME_OTHER_ACTION' },
    );

    expect(state.theme).toEqual(THEME_DARK);
  });

  describe('setTheme', () => {
    it('throws for an invalid theme', () => {
      expect(() => setTheme('purple')).toThrow(/theme must be one of/);
    });
  });
});
