/* @flow */
import * as React from 'react';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import type { ResultShelfType } from 'amo/reducers/home';

import './styles.scss';

type Props = {|
  addonInstallSource?: string,
  loading: boolean,
  placeholderCount: number,
  shelves: Array<ResultShelfType>,
|};

export default class HomepageShelves extends React.Component<Props> {
  static defaultProps = {
    placeholderCount: LANDING_PAGE_EXTENSION_COUNT,
  };

  render() {
    const {
      addonInstallSource,
      loading,
      placeholderCount,
      shelves,
    } = this.props;

    const homepageShelves = shelves.map((shelf) => {
      const { addons, endpoint, footer_text, title } = shelf;
      const header = title.replace(/\s/g, '');

      let isTheme = false;
      if (endpoint === 'search-themes') {
        isTheme = true;
      }

      const count = isTheme ? LANDING_PAGE_THEME_COUNT : placeholderCount;

      let footerText = null;
      /* Update default footer text */
      const defaultFooterText = 'See more';
      if (footer_text === null) {
        footerText = defaultFooterText;
      } else {
        footerText = footer_text;
      }

      return (
        <LandingAddonsCard
          addonInstallSource={addonInstallSource}
          addons={addons}
          className={`Home-${header}`}
          footerText={footerText}
          footerLink={{
            pathname: '/search/',
          }}
          header={title}
          isTheme
          key={title}
          loading={loading}
          placeholderCount={count}
        />
      );
    });

    return homepageShelves;
  }
}
