/* @flow */
import * as React from 'react';
import config from 'config';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import LoadingText from 'amo/components/LoadingText';
import {
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import type { ResultShelfType } from 'amo/reducers/home';
import type { I18nType } from 'amo/types/i18n';

type InternalProps = {|
  i18n: I18nType,
|};

type Props = {|
  ...InternalProps,
  loading: boolean,
  shelves: Array<ResultShelfType>,
|};

class HomepageShelves extends React.Component<Props> {
  render(): React.Node {
    const { i18n, loading, shelves } = this.props;

    let shelvesContent;

    if (loading) {
      shelvesContent = (
        <div className="HomepageShelves-loading">
          {[1, 2, 3].map((key) => {
            return (
              <LandingAddonsCard
                className="HomepageShelves-loading-text"
                key={`HomepageShelves-loading-text-${key}`}
                header={<LoadingText width={100} />}
                loading
              />
            );
          })}
        </div>
      );
    } else {
      shelvesContent = shelves.map((shelf) => {
        const { addons, criteria, endpoint, footer, title } = shelf;
        const MOZILLA_USER_ID = config.get('mozillaUserId');
        const titleStr = title.toString();
        const header = titleStr.replace(/\s/g, '-');

        const footerText =
          footer && footer.text
            ? footer.text
            : i18n.sprintf(i18n.gettext('See more %(categoryName)s'), {
                categoryName: titleStr.toLowerCase(),
              });

        const addonInstallSource =
          endpoint === 'collections'
            ? INSTALL_SOURCE_FEATURED_COLLECTION
            : INSTALL_SOURCE_FEATURED;

        const count =
          endpoint === 'search-themes'
            ? LANDING_PAGE_THEME_COUNT
            : LANDING_PAGE_EXTENSION_COUNT;

        let footerUrl;
        if (footer && footer.url) {
          if (footer.url.startsWith('/')) {
            footerUrl = footer.url;
          } else {
            footerUrl = `/${footer.url}`;
          }
        }

        const defaultFooterUrl =
          endpoint === 'collections'
            ? `/collections/${MOZILLA_USER_ID}/${criteria}/`
            : `/search/${criteria}/`;

        const footerLink = footerUrl || defaultFooterUrl;

        return (
          <LandingAddonsCard
            addonInstallSource={addonInstallSource}
            addons={addons}
            className={`Home-${header}`}
            footerText={footerText}
            footerLink={footerLink}
            header={titleStr}
            isTheme={endpoint === 'search-themes'}
            key={header}
            placeholderCount={count}
          />
        );
      });
    }

    return <div className="Home-HomepageShelves">{shelvesContent}</div>;
  }
}

export default (translate()(HomepageShelves): React.ComponentType<Props>);
