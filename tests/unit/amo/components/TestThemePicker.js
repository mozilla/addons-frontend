import * as React from 'react';
import userEvent from '@testing-library/user-event';

import ThemePicker from 'amo/components/ThemePicker';
import {
  THEME_AUTO,
  THEME_DARK,
  THEME_LIGHT,
  THEME_STORAGE_KEY,
} from 'amo/constants';
import { setTheme } from 'amo/reducers/theme';
import {
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  const fakeLocalStorage = () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
  });

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  afterEach(() => {
    // The component writes to the real <html> element; reset between tests.
    document.documentElement.removeAttribute('data-theme');
  });

  const render = ({ _localStorage = fakeLocalStorage(), ...props } = {}) => {
    return defaultRender(
      <ThemePicker _localStorage={_localStorage} {...props} />,
      {
        store,
      },
    );
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

  it('persists the selected theme in localStorage', async () => {
    const _localStorage = fakeLocalStorage();
    render({ _localStorage });

    await userEvent.selectOptions(screen.getByRole('combobox'), THEME_LIGHT);

    expect(_localStorage.setItem).toHaveBeenCalledWith(
      THEME_STORAGE_KEY,
      THEME_LIGHT,
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
