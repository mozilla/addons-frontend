/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { visibleAddonType } from 'amo/utils';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import type { I18nType } from 'amo/types/i18n';

type Props = {||};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class NotFoundBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { i18n } = this.props;

    const paragraphWithLinks = replaceStringsWithJSX({
      text: i18n.t(
        'Try visiting the page later, as the theme or extension may become available again. Alternatively, you may be able to find what you\u2019re looking for in one of the available %(extensionStart)sextensions%(extensionEnd)s or %(themeStart)sthemes%(themeEnd)s, or by asking for help on our %(communityStart)scommunity forums%(communityEnd)s.',
      ),
      replacements: [
        [
          'extensionStart',
          'extensionEnd',
          (text) => (
            <Link
              key="link-extensions"
              to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}
            >
              {text}
            </Link>
          ),
        ],

        [
          'themeStart',
          'themeEnd',
          (text) => (
            <Link
              key="link-themes"
              to={`/${visibleAddonType(ADDON_TYPE_STATIC_THEME)}/`}
            >
              {text}
            </Link>
          ),
        ],

        [
          'communityStart',
          'communityEnd',
          (text) => (
            <Link
              key="link-community"
              href="https://discourse.mozilla.org/c/add-ons"
              prependClientApp={false}
              prependLang={false}
            >
              {text}
            </Link>
          ),
        ],
      ],
    });

    return (
      <ErrorComponent
        code={404}
        header={i18n.t('Oops! We can’t find that page')}
      >
        <p>
          {i18n.t(
            'If you\u2019ve followed a link from another site for an extension or theme, that item is no longer available. This could be because:',
          )}
        </p>
        <ul>
          <li>
            {i18n.t(
              'The developer removed it. Developers commonly do this because they no longer support the extension or theme, or have replaced it.',
            )}
          </li>
          <li>
            {i18n.t(
              'Mozilla removed it. This can happen when issues are found during the review of the extension or theme, or the extension or theme has been abusing the terms and conditions for addons.mozilla.org. The developer has the opportunity to resolve the issues and make the add-on available again.',
            )}
          </li>
        </ul>
        <p className="Errors-paragraph-with-links">{paragraphWithLinks}</p>
      </ErrorComponent>
    );
  }
}

const NotFound: React.ComponentType<Props> = compose(translate())(NotFoundBase);

export default NotFound;
