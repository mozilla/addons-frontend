/* @flow */
import * as React from 'react';
import config from 'config';

import translate from 'amo/i18n/translate';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import type { ResultShelfType } from 'amo/reducers/home';

import './styles.scss';

export const MOZILLA_USER_ID = config.get('mozillaUserId');

type Props = {|
  i18n: Object,
  loading: boolean,
  placeholderCount: number,
  shelves: Array<ResultShelfType>,
|};

class HomepageShelves extends React.Component<Props> {
  static defaultProps = {
    placeholderCount: LANDING_PAGE_EXTENSION_COUNT,
  };

  render() {
    const { i18n, loading, placeholderCount, shelves } = this.props;

    const homepageShelves: Array<React.Node> = shelves.map((shelf) => {
      const { addons, criteria, endpoint, footer, title } = shelf;
      const titleStr = title.toString();
      const header = titleStr.replace(/\s/g, '');
      const footerText = footer ? footer.text : 'See more';

      const addonInstallSource =
        endpoint === 'collections'
          ? INSTALL_SOURCE_FEATURED_COLLECTION
          : INSTALL_SOURCE_FEATURED;

      const className =
        endpoint === 'collections'
          ? 'Home-FeaturedCollection'
          : `Home-${header}`;

      const count =
        endpoint === 'search-themes'
          ? LANDING_PAGE_THEME_COUNT
          : placeholderCount;

      const footerLink =
        endpoint === 'collections'
          ? `/collections/${MOZILLA_USER_ID}/${criteria}/`
          : `/${criteria}/`;

      return (
        <LandingAddonsCard
          addonInstallSource={addonInstallSource}
          addons={addons}
          className={className}
          footerText={i18n.sprintf(i18n.gettext('%(text)s'), {
            text: footerText,
          })}
          footerLink={footerLink}
          header={titleStr}
          isTheme={endpoint === 'search-themes' ? true : undefined}
          key={header}
          loading={loading}
          placeholderCount={count}
        />
      );
    });

    return homepageShelves;
  }
}

export default translate()(HomepageShelves);
