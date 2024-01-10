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
  i18n: I18nType,
|};

export class SuggestedPagesBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { i18n } = this.props;

    return (
      <section className="SuggestedPages">
        <h2>{i18n.t('Suggested Pages')}</h2>

        <ul>
          <li>
            <Link to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}>
              {i18n.t('Browse all extensions')}
            </Link>
          </li>
          <li className="SuggestedPages-link-themes">
            <Link to={`/${visibleAddonType(ADDON_TYPE_STATIC_THEME)}/`}>
              {i18n.t('Browse all themes')}
            </Link>
          </li>
          <li>
            <Link to="/">{i18n.t('Add-ons Home Page')}</Link>
          </li>
        </ul>
      </section>
    );
  }
}

export default (compose(translate())(
  SuggestedPagesBase,
): React.ComponentType<Props>);
