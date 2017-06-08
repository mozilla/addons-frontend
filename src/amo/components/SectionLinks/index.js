import classNames from 'classnames';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Link from 'amo/components/Link';
import type { ViewContextType } from 'amo/reducers/viewContext';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_EXPLORE,
  VIEW_CONTEXT_HOMEPAGE,
  validAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import type { AddonTypeType } from 'core/types/addons';
import { visibleAddonType } from 'core/utils';

import './styles.scss';


type SectionLinksProps = {
  addonType: AddonTypeType,
  isExploring: boolean,
  i18n: Object,
}

export class SectionLinksBase extends React.Component {
  props: SectionLinksProps;

  render() {
    const { addonType, i18n, isExploring } = this.props;

    return (
      <ul className="SectionLinks">
        <li>
          <Link className={classNames('SectionLinks-link', {
            'SectionLinks-link--active': isExploring,
          })} to="/">
            {i18n.gettext('Explore')}
          </Link>
        </li>
        <li>
          <Link
            className={classNames('SectionLinks-link', {
              'SectionLinks-link--active': addonType === ADDON_TYPE_EXTENSION,
            })}
            to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}
          >
            {i18n.gettext('Extensions')}
          </Link>
        </li>
        <li>
          <Link
            className={classNames('SectionLinks-link', {
              'SectionLinks-link--active': addonType === ADDON_TYPE_THEME,
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

export function mapStateToProps(state: { viewContext: ViewContextType }) {
  return {
    addonType: validAddonTypes.includes(state.viewContext.context) ?
      state.viewContext.context : null,
    isExploring: [
      VIEW_CONTEXT_EXPLORE,
      VIEW_CONTEXT_HOMEPAGE,
    ].includes(state.viewContext.context),
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(SectionLinksBase);
