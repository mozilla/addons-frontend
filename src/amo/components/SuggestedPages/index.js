/* @flow */
import config from 'config';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { shouldShowThemes } from 'amo/utils';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { visibleAddonType } from 'core/utils';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';

type Props = {||};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  i18n: I18nType,
  clientApp: string,
|};

export class SuggestedPagesBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
  };

  render() {
    const { _config, clientApp, i18n } = this.props;

    return (
      <section className="SuggestedPages">
        <h2>{i18n.gettext('Suggested Pages')}</h2>

        <ul>
          <li>
            <Link to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}>
              {i18n.gettext('Browse all extensions')}
            </Link>
          </li>
          {shouldShowThemes({ _config, clientApp }) && (
            <li className="SuggestedPages-link-themes">
              <Link to={`/${visibleAddonType(ADDON_TYPE_THEME)}/`}>
                {i18n.gettext('Browse all themes')}
              </Link>
            </li>
          )}
          <li>
            <Link to="/">{i18n.gettext('Add-ons Home Page')}</Link>
          </li>
        </ul>
      </section>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
  };
};

const SuggestedPages: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(SuggestedPagesBase);

export default SuggestedPages;
