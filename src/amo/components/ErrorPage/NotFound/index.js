/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import NestedStatus from 'react-nested-status';

import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTML, visibleAddonType } from 'core/utils';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
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

    // This localized string contains two links. We want each link to use
    // client-side navigation, hence the need for
    // `getLocalizedTextWithLinkParts()` (used below) to split the string and
    // insert the `Link` React component. This works well in various places
    // because we usually have one link. Yet, here we have two links and we
    // need to be careful about the order of the two links because localizers
    // may change the order of the links as described in:
    // https://github.com/mozilla/addons-frontend/issues/7597
    const text = i18n.gettext(
      `Try visiting the page later, as the theme or extension may become
      available again. Alternatively, you may be able to find what you’re
      looking for in one of the available %(linkStart)sextensions%(linkEnd)s or
      %(secondLinkStart)sthemes%(secondLinkEnd)s.`,
    );

    // Those variables are used by `getLocalizedTextWithLinkParts()`.
    let linkStart = 'linkStart';
    let linkEnd = 'linkEnd';
    // By setting `linkStart`/`linkEnd` here, we can reuse
    // `getLocalizedTextWithLinkParts()` directly after.
    let otherVars = {
      secondLinkStart: '%(linkStart)s',
      secondLinkEnd: '%(linkEnd)s',
    };
    // The `to` parameters of the links. They should be inverted if links are
    // inverted in the localized string.
    let firstLinkTo = `/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`;
    let secondLinkTo = `/${visibleAddonType(ADDON_TYPE_THEME)}/`;

    // We need to know which link comes first in the localized string to avoid
    // the issue mentioned above, so we look up the position of each link.
    if (text.search('linkStart') > text.search('secondLinkStart')) {
      linkStart = 'secondLinkStart';
      linkEnd = 'secondLinkEnd';
      // By setting `linkStart`/`linkEnd` here, we can reuse
      // `getLocalizedTextWithLinkParts()` directly after.
      otherVars = {
        linkStart: '%(linkStart)s',
        linkEnd: '%(linkEnd)s',
      };

      const linkTo = firstLinkTo;
      firstLinkTo = secondLinkTo;
      secondLinkTo = linkTo;
    }

    // We use `getLocalizedTextWithLinkParts()` two times to create all the
    // variables needed to display both the `Link` components and texts
    // before/after.
    let linkParts = getLocalizedTextWithLinkParts({
      i18n,
      text,
      linkStart,
      linkEnd,
      otherVars,
    });

    linkParts = {
      first: linkParts,
      second: getLocalizedTextWithLinkParts({
        i18n,
        text: linkParts.afterLinkText,
      }),
    };

    return (
      <NestedStatus code={404}>
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
                  url: 'https://github.com/mozilla/addons-frontend/issues/new/',
                },
              ),
              ['a'],
            )}
          />
          <p className="ErrorPage-paragraph-with-links">
            {linkParts.first.beforeLinkText}
            <Link to={firstLinkTo}>{linkParts.first.innerLinkText}</Link>
            {linkParts.second.beforeLinkText}
            <Link to={secondLinkTo}>{linkParts.second.innerLinkText}</Link>
            {linkParts.second.afterLinkText}
          </p>
        </Card>
      </NestedStatus>
    );
  }
}

const NotFound: React.ComponentType<Props> = compose(translate())(NotFoundBase);

export default NotFound;
