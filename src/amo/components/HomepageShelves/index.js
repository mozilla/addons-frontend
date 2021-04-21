/* @flow */
import * as React from 'react';
import config from 'config';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import LoadingText from 'amo/components/LoadingText';
import {
  ADDON_TYPE_STATIC_THEME,
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { checkInternalURL } from 'amo/utils';
import type { ResultShelfType } from 'amo/reducers/home';
import type { I18nType } from 'amo/types/i18n';

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
export const HOMESHELVES_ENDPOINT_SEARCH_THEMES = 'search-themes';

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

      const hasThemes =
        endpoint === HOMESHELVES_ENDPOINT_SEARCH_THEMES ||
        addonType === ADDON_TYPE_STATIC_THEME;

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

      return (
        <LandingAddonsCard
          addonInstallSource={addonInstallSource}
          addons={addons}
          className={`Home-${shelfKey}`}
          footerText={footerText}
          footerLink={footerLink}
          header={title}
          isTheme={hasThemes}
          key={shelfKey}
          placeholderCount={count}
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
