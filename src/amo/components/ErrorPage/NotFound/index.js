/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import Link from 'amo/components/Link';
import Page from 'amo/components/Page';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTML, visibleAddonType } from 'core/utils';
import { replaceStringsWithJSX } from 'core/i18n/utils';
import Card from 'ui/components/Card';
import type { I18nType } from 'core/types/i18n';

import '../styles.scss';

type Props = {|
  errorCode?: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class NotFoundBase extends React.Component<InternalProps> {
  render() {
    const { i18n } = this.props;

    const paragraphWithLinks = replaceStringsWithJSX({
      text: i18n.gettext(
        `Try visiting the page later, as the theme or extension may become
        available again. Alternatively, you may be able to find what you’re
        looking for in one of the available %(linkStart)sextensions%(linkEnd)s
        or %(secondLinkStart)sthemes%(secondLinkEnd)s.`,
      ),
      replacements: [
        [
          'linkStart',
          'linkEnd',
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
          'secondLinkStart',
          'secondLinkEnd',
          (text) => (
            <Link
              key="link-themes"
              to={`/${visibleAddonType(ADDON_TYPE_THEME)}/`}
            >
              {text}
            </Link>
          ),
        ],
      ],
    });

    return (
      <NestedStatus code={404}>
        <Page>
          <Card
            className="ErrorPage NotFound"
            header={i18n.gettext('Oops! We can’t find that page')}
          >
            <p>
              {i18n.gettext(`If you’ve followed a link from another site for an
        extension or theme, that item is no longer available. This could
        be because:`)}
            </p>
            <ul>
              <li>
                {i18n.gettext(`The developer removed it. Developers commonly do
        this because they no longer support the extension or theme, or
        have replaced it.`)}
              </li>
              <li>
                {i18n.gettext(`Mozilla removed it. This can happen when issues
        are found during the review of the extension or theme, or the
        extension or theme has been abusing the terms and conditions
        for addons.mozilla.org. The developer has the opportunity to
        resolve the issues and make the add-on available again.`)}
              </li>
            </ul>
            <p
              className="ErrorPage-paragraph-with-links"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`If you’ve followed a link on this site, you’ve
        have found a mistake. Help us fix the link by <a
        href="%(url)s">filing an issue</a>. Tell us where you came
        from and what you were looking for, and we'll get it
        sorted.`),
                  {
                    url:
                      'https://github.com/mozilla/addons-frontend/issues/new/',
                  },
                ),
                ['a'],
              )}
            />
            <p className="ErrorPage-paragraph-with-links">
              {paragraphWithLinks}
            </p>
          </Card>
        </Page>
      </NestedStatus>
    );
  }
}

const NotFound: React.ComponentType<Props> = compose(translate())(NotFoundBase);

export default NotFound;
