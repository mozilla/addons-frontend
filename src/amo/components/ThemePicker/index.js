/* @flow */
/* global window */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import log from 'amo/logger';
import { setTheme } from 'amo/reducers/theme';
import {
  THEME_AUTO,
  THEME_DARK,
  THEME_LIGHT,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import type { AppState } from 'amo/store';
import type { ThemePreference } from 'amo/reducers/theme';
import type { DispatchFunc } from 'amo/types/redux';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {||};

type PropsFromState = {|
  theme: ThemePreference,
|};

type DefaultProps = {|
  _document: typeof document | null,
  _localStorage: typeof window.localStorage | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  dispatch: DispatchFunc,
  i18n: I18nType,
|};

export class ThemePickerBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _document: typeof document !== 'undefined' ? document : null,
    _localStorage: typeof window !== 'undefined' ? window.localStorage : null,
  };

  onChange: (event: SyntheticEvent<HTMLSelectElement>) => void = (event) => {
    const theme = event.currentTarget.value;
    if (THEME_PREFERENCES.includes(theme)) {
      this.changeTheme(theme);
    }
  };

  changeTheme(theme: ThemePreference) {
    const { _document, _localStorage, dispatch } = this.props;

    dispatch(setTheme(theme));

    // Persist the choice client-side so it can be re-applied on the next page
    // load (see amo/client/base.js). We deliberately avoid a cookie so the
    // preference never reaches the server and HTML responses stay cacheable.
    if (_localStorage) {
      try {
        _localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (error) {
        // localStorage can throw (e.g. private mode or quota); the theme still
        // applies for this session, we just can't persist it.
        log.warn(`Could not persist theme preference: ${error}`);
      }
    }

    // Update <html data-theme> immediately so the page recolors without a
    // reload. "auto" removes the attribute and defers to prefers-color-scheme.
    const documentElement = _document && _document.documentElement;
    if (documentElement) {
      if (theme === THEME_AUTO) {
        documentElement.removeAttribute('data-theme');
      } else {
        documentElement.setAttribute('data-theme', theme);
      }
    }
  }

  render(): React.Node {
    const { i18n, theme } = this.props;

    const labels = {
      [THEME_AUTO]: i18n.gettext('Automatic (match system)'),
      [THEME_LIGHT]: i18n.gettext('Light'),
      [THEME_DARK]: i18n.gettext('Dark'),
    };

    return (
      <div className="ThemePicker">
        <label htmlFor="theme-picker" className="ThemePicker-header">
          {i18n.gettext('Change theme')}
        </label>
        <select
          className="ThemePicker-selector"
          id="theme-picker"
          onChange={this.onChange}
          value={theme}
        >
          {THEME_PREFERENCES.map((preference) => (
            <option key={preference} value={preference}>
              {labels[preference]}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  return { theme: state.theme.theme };
}

const ThemePicker: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(ThemePickerBase);

export default ThemePicker;
