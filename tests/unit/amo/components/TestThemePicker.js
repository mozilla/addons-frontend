import * as React from 'react';
import userEvent from '@testing-library/user-event';

import ThemePicker from 'amo/components/ThemePicker';
import { THEME_AUTO, THEME_DARK, THEME_LIGHT } from 'amo/constants';
import { setTheme } from 'amo/reducers/theme';
import {
  dispatchClientMetadata,
  fakeCookies,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  afterEach(() => {
    // The component writes to the real <html> element; reset between tests.
    document.documentElement.removeAttribute('data-theme');
  });

  const render = ({ cookies = fakeCookies(), ...props } = {}) => {
    return defaultRender(<ThemePicker cookies={cookies} {...props} />, {
      store,
    });
  };

  it('renders one option per theme preference', () => {
    render();

    expect(screen.getByRole('option', { name: /Automatic/ })).toHaveValue(
      THEME_AUTO,
    );
    expect(screen.getByRole('option', { name: 'Light' })).toHaveValue(
      THEME_LIGHT,
    );
    expect(screen.getByRole('option', { name: 'Dark' })).toHaveValue(
      THEME_DARK,
    );
  });

  it('reflects the current theme from the store', () => {
    store.dispatch(setTheme(THEME_DARK));
    render();

    expect(screen.getByRole('combobox')).toHaveValue(THEME_DARK);
  });

  it('dispatches setTheme when a new theme is selected', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    await userEvent.selectOptions(screen.getByRole('combobox'), THEME_DARK);

    expect(dispatch).toHaveBeenCalledWith(setTheme(THEME_DARK));
    expect(store.getState().theme.theme).toEqual(THEME_DARK);
  });

  it('persists the selected theme in a cookie', async () => {
    const cookies = fakeCookies();
    render({ cookies });

    await userEvent.selectOptions(screen.getByRole('combobox'), THEME_LIGHT);

    expect(cookies.set).toHaveBeenCalledWith(
      'amo_theme',
      THEME_LIGHT,
      expect.objectContaining({ path: '/' }),
    );
  });

  it('sets the data-theme attribute when forcing a theme', async () => {
    render();

    await userEvent.selectOptions(screen.getByRole('combobox'), THEME_DARK);

    expect(document.documentElement).toHaveAttribute('data-theme', THEME_DARK);
  });

  it('removes the data-theme attribute when choosing automatic', async () => {
    document.documentElement.setAttribute('data-theme', THEME_DARK);
    store.dispatch(setTheme(THEME_DARK));
    render();

    await userEvent.selectOptions(screen.getByRole('combobox'), THEME_AUTO);

    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });
});
