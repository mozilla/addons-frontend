import classNames from 'classnames';
import React from 'react';
import { withRouter } from 'react-router'
import { compose } from 'redux';
import { connect } from 'react-redux';

import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import type { ApiStateType } from 'core/reducers/api';
import type { ReactRouterLocation } from 'core/types/router';
import { visibleAddonType } from 'core/utils';

import './styles.scss';


type SectionLinksProps = {
  i18n: Object,
  location: ReactRouterLocation,
}

export class SectionLinksBase extends React.Component {
  props: SectionLinksProps;

  static defaultProps = {
    location: {},
  }

  render() {
    const { clientApp, i18n, lang, location } = this.props;

    let isHome;
    let isExtensions;
    let isThemes;
    if (location && location.pathname) {
      isHome = location.pathname === `/${lang}/${clientApp}/`;
      isExtensions = Boolean(location.pathname.startsWith(
        `/${lang}/${clientApp}/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`));
      isThemes = Boolean(location.pathname.startsWith(
        `/${lang}/${clientApp}/${visibleAddonType(ADDON_TYPE_THEME)}/`));
    }

    return (
      <ul className="SectionLinks">
        <li>
          <Link className={classNames('SectionLinks-link', {
            'SectionLinks-link--active': isHome,
          })} to="/">
            {i18n.gettext('Explore')}
          </Link>
        </li>
        <li>
          <Link
            className={classNames('SectionLinks-link', {
              'SectionLinks-link--active': isExtensions,
            })}
            to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}
          >
            {i18n.gettext('Extensions')}
          </Link>
        </li>
        <li>
          <Link
            className={classNames('SectionLinks-link', {
              'SectionLinks-link--active': isThemes,
            })}
            to={`/${visibleAddonType(ADDON_TYPE_THEME)}/`}
          >
            {i18n.gettext('Themes')}
          </Link>
        </li>
      </ul>
    );
  }
}

export const mapStateToProps = (state: { api: ApiStateType }) => ({
  clientApp: state.api.clientApp,
  lang: state.api.lang,
});

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(SectionLinksBase);
