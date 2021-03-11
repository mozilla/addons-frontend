/* @flow */
import * as React from 'react';
import config from 'config';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_FEATURED_COLLECTION,
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import type { ResultShelfType } from 'amo/reducers/home';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type DefaultProps = {|
  placeholderCount: number,
|};

type Props = {|
  ...DefaultProps,
  loading: boolean,
  placeholderCount: number,
  shelves: Array<ResultShelfType>,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

class HomepageShelves extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    placeholderCount: LANDING_PAGE_EXTENSION_COUNT,
  };

  render(): React.Node {
    const { i18n, loading, placeholderCount, shelves } = this.props;

    const MOZILLA_USER_ID = config.get('mozillaUserId');

    const homepageShelves: Array<React.Node> = shelves.map((shelf) => {
      const { addons, criteria, endpoint, footer, title } = shelf;
      const titleStr = title.toString();
      const header = titleStr.replace(/\s/g, '-');

      const footerText =
        footer && footer.text
          ? footer.text
          : i18n.sprintf(i18n.gettext('See more %(text)s'), {
              text: titleStr.toLowerCase(),
            });

      const addonInstallSource =
        endpoint === 'collections'
          ? INSTALL_SOURCE_FEATURED_COLLECTION
          : INSTALL_SOURCE_FEATURED;

      const count =
        endpoint === 'search-themes'
          ? LANDING_PAGE_THEME_COUNT
          : placeholderCount;

      const footerLink =
        endpoint === 'collections'
          ? `/collections/${MOZILLA_USER_ID}/${criteria}/`
          : `/search/${criteria}/`;

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
          loading={loading}
          placeholderCount={count}
        />
      );
    });

    return homepageShelves;
  }
}

export default (translate()(
  HomepageShelves,
): React.ComponentType<InternalProps>);
