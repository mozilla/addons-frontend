/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import { visibleAddonType } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Props = {||};

type InternalProps = {|
  ...Props,
  jed: I18nType,
|};

export class UnavailableForLegalReasonsBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { jed } = this.props;

    const paragraphWithLinks = replaceStringsWithJSX({
      text: jed.gettext(
        `You may be able to find what you’re looking for in one of the available
        %(extensionStart)sextensions%(extensionEnd)s or
        %(themeStart)sthemes%(themeEnd)s, or by asking for help on our
        %(communityStart)scommunity forums%(communityEnd)s.`,
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
        code={451}
        header={jed.gettext('That page is not available in your region')}
      >
        <p>
          {jed.gettext(
            'The page you tried to access is not available in your region.',
          )}
        </p>
        <p className="Errors-paragraph-with-links">{paragraphWithLinks}</p>
      </ErrorComponent>
    );
  }
}

const UnavailableForLegalReasons: React.ComponentType<Props> = compose(
  translate(),
)(UnavailableForLegalReasonsBase);

export default UnavailableForLegalReasons;
