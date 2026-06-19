/* @flow */
import * as React from 'react';
import config from 'config';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withCookies, Cookies } from 'react-cookie';

import { setTheme } from 'amo/reducers/theme';
import {
  THEME_AUTO,
  THEME_DARK,
  THEME_LIGHT,
  THEME_PREFERENCES,
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
  _config: typeof config,
  _document: typeof document | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  cookies: typeof Cookies,
  dispatch: DispatchFunc,
  i18n: I18nType,
|};

export class ThemePickerBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _config: config,
    _document: typeof document !== 'undefined' ? document : null,
  };

  onChange: (event: SyntheticEvent<HTMLSelectElement>) => void = (event) => {
    const theme = event.currentTarget.value;
    if (THEME_PREFERENCES.includes(theme)) {
      this.changeTheme(theme);
    }
  };

  changeTheme(theme: ThemePreference) {
    const { _config, _document, cookies, dispatch } = this.props;

    dispatch(setTheme(theme));

    // Persist the choice so the server can render the right theme on the next
    // request (see amo/server/base.js), avoiding a flash on reload.
    cookies.set(_config.get('themeCookieName'), theme, {
      maxAge: _config.get('cookieMaxAge'),
      path: '/',
      sameSite: _config.get('cookieSameSite'),
      secure: _config.get('cookieSecure'),
    });

    // Update <html data-theme> immediately so the page recolors without a
    // reload. "auto" removes the attribute and defers to prefers-color-scheme.
    if (_document) {
      if (theme === THEME_AUTO) {
        _document.documentElement.removeAttribute('data-theme');
      } else {
        _document.documentElement.setAttribute('data-theme', theme);
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
  withCookies,
  connect(mapStateToProps),
  translate(),
)(ThemePickerBase);

export default ThemePicker;
