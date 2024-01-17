/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { visibleAddonType } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Props = {||};

type InternalProps = {|
  ...Props,
  jed: I18nType,
|};

export class SuggestedPagesBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { jed } = this.props;

    return (
      <section className="SuggestedPages">
        <h2>{jed.gettext('Suggested Pages')}</h2>

        <ul>
          <li>
            <Link to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}>
              {jed.gettext('Browse all extensions')}
            </Link>
          </li>
          <li className="SuggestedPages-link-themes">
            <Link to={`/${visibleAddonType(ADDON_TYPE_STATIC_THEME)}/`}>
              {jed.gettext('Browse all themes')}
            </Link>
          </li>
          <li>
            <Link to="/">{jed.gettext('Add-ons Home Page')}</Link>
          </li>
        </ul>
      </section>
    );
  }
}

export default (compose(translate())(
  SuggestedPagesBase,
): React.ComponentType<Props>);
