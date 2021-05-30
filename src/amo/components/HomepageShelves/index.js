/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import config from 'config';

import AddonsCard from 'amo/components/AddonsCard';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import LoadingText from 'amo/components/LoadingText';
import {
  ADDON_TYPE_STATIC_THEME,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import { checkInternalURL } from 'amo/utils';
import type { ResultShelfType } from 'amo/reducers/home';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  loading: boolean,
  shelves: Array<ResultShelfType>,
|};

type InternalProps = {|
  _checkInternalURL: typeof checkInternalURL,
  i18n: I18nType,
  ...Props,
|};

export const HOMESHELVES_ENDPOINT_COLLECTIONS = 'collections';
export const HOMESHELVES_ENDPOINT_SEARCH = 'search';

export const HomepageShelvesBase = (props: InternalProps): React.Node => {
  const {
    _checkInternalURL = checkInternalURL,
    i18n,
    loading,
    shelves,
  } = props;

  let shelvesContent;

  if (loading) {
    shelvesContent = (
      // Display loading shelves to keep components that fall below the fold from
      // shifting after homepage shelves are loaded from the API
      <div className="HomepageShelves-loading">
        {[1, 2, 3].map((key) => {
          return (
            <LandingAddonsCard
              className="HomepageShelves-loading-card"
              key={`HomepageShelves-loading-${key}`}
              header={<LoadingText width={100} />}
              loading
            />
          );
        })}
      </div>
    );
  } else {
    shelvesContent = shelves.map((shelf) => {
      const { addons, addonType, criteria, endpoint, footer, title } = shelf;
      const MOZILLA_USER_ID = config.get('mozillaUserId');
      const shelfKey = title.replace(/\s/g, '-');

      const footerText =
        footer && footer.text
          ? footer.text
          : i18n.sprintf(i18n.gettext('See more %(categoryName)s'), {
              categoryName: title.toLowerCase(),
            });

      const addonInstallSource =
        endpoint === HOMESHELVES_ENDPOINT_COLLECTIONS
          ? INSTALL_SOURCE_FEATURED_COLLECTION
          : INSTALL_SOURCE_FEATURED;

      const hasThemes = addonType === ADDON_TYPE_STATIC_THEME;

      const count = hasThemes
        ? LANDING_PAGE_THEME_COUNT
        : LANDING_PAGE_EXTENSION_COUNT;

      let footerLink;
      if (footer && footer.url) {
        const internalUrlCheck = _checkInternalURL({ urlString: footer.url });
        if (internalUrlCheck.isInternal) {
          footerLink = internalUrlCheck.relativeURL;
        } else {
          footerLink = { href: footer.url };
        }
      } else {
        footerLink =
          endpoint === HOMESHELVES_ENDPOINT_COLLECTIONS
            ? `/collections/${MOZILLA_USER_ID}/${criteria}/`
            : `/search/${criteria}`;
      }

      let footerLinkHtml = null;
      const footerLinkProps = {};

      if (addons && addons.length >= count) {
        if (footerLink && typeof footerLink === 'object') {
          // If an href has been passed, use that for the Link.
          if (footerLink.href) {
            footerLinkProps.href = footerLink.href;
            footerLinkProps.prependClientApp = false;
            footerLinkProps.prependLang = false;
            footerLinkProps.target = '_blank';
          } else {
            // As a convenience, fix the query parameter.
            footerLinkProps.to = {
              ...footerLink,
              query: convertFiltersToQueryParams(footerLink),
            };
          }
        } else {
          // It's just a string, so pass it into the `to` prop.
          footerLinkProps.to = footerLink;
        }

        footerLinkHtml = <Link {...footerLinkProps}>{footerText}</Link>;
      }

      return (
        <AddonsCard
          addonInstallSource={addonInstallSource}
          addons={addons}
          className={makeClassName(`Home-${shelfKey}`, {
            'HomepageShelvesCard-Themes': hasThemes,
          })}
          footerLink={footerLinkHtml}
          header={title}
          key={shelfKey}
          loading={loading}
          placeholderCount={count}
          showPromotedBadge={false}
          type="horizontal"
          useThemePlaceholder={hasThemes}
        />
      );
    });
  }

  return <div className="HomepageShelves">{shelvesContent}</div>;
};

const HomepageShelves: React.ComponentType<Props> = translate()(
  HomepageShelvesBase,
);

export default HomepageShelves;
