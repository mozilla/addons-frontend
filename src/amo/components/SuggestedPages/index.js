import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { visibleAddonType } from 'core/utils';

export class SuggestedPagesBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    return (
      <section className="SuggestedPages">
        <h2>{i18n.gettext('Suggested Pages')}</h2>

        <ul>
          <li>
            <Link to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}>
              {i18n.gettext('Browse all extensions')}
            </Link>
          </li>
          <li>
            <Link to={`/${visibleAddonType(ADDON_TYPE_THEME)}/`}>
              {i18n.gettext('Browse all themes')}
            </Link>
          </li>
          <li>
            <Link to="/">
              {i18n.gettext('Add-ons Home Page')}
            </Link>
          </li>
        </ul>
      </section>
    );
  }
}

export default compose(
  translate(),
)(SuggestedPagesBase);
