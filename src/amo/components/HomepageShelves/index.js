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

import './styles.scss';

type DefaultProps = {|
  placeholderCount: number,
|};

type InternalProps = {|
  i18n: I18nType,
|};

type Props = {|
  ...DefaultProps,
  ...InternalProps,
  loading: boolean,
  placeholderCount?: number,
  shelves: Array<ResultShelfType>,
|};

class HomepageShelves extends React.Component<Props> {
  /* eslint-disable react/no-array-index-key */
  static defaultProps: DefaultProps = {
    placeholderCount: LANDING_PAGE_EXTENSION_COUNT,
  };

  homepageShelves: Array<React.Node> = this.props.shelves.map((shelf) => {
    const { addons, criteria, endpoint, footer, title } = shelf;
    const MOZILLA_USER_ID = config.get('mozillaUserId');
    const titleStr = title.toString();
    const header = titleStr.replace(/\s/g, '-');

    const footerText =
      footer && footer.text
        ? footer.text
        : this.props.i18n.sprintf(
            this.props.i18n.gettext('See more %(categoryName)s'),
            {
              categoryName: titleStr.toLowerCase(),
            },
          );

    const addonInstallSource =
      endpoint === 'collections'
        ? INSTALL_SOURCE_FEATURED_COLLECTION
        : INSTALL_SOURCE_FEATURED;

    const count =
      endpoint === 'search-themes'
        ? LANDING_PAGE_THEME_COUNT
        : this.props.placeholderCount;

    let footerLinkHtml;
    if (footer && footer.url) {
      footerLinkHtml = <a href={footer.url}>{footerText}</a>;
    }

    const defaultFooterUrl =
      endpoint === 'collections'
        ? `/collections/${MOZILLA_USER_ID}/${criteria}/`
        : `/search/${criteria}/`;

    const footerLink = footerLinkHtml || defaultFooterUrl;

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
        loading={this.props.loading}
        placeholderCount={count}
      />
    );
  });

  loadingShelves = (
    <div className="HomepageShelves-loading">
      {Array(3)
        .fill(0)
        .map((value, index) => {
          return (
            <LandingAddonsCard
              className="HomepageShelves-loading-text"
              key={`HomepageShelves-loading-text-${index}`}
              header={<LoadingText width={100} />}
              loading={this.props.loading}
            />
          );
        })}
    </div>
  );

  render(): React.Node {
    const { loading } = this.props;

    let shelvesContent;

    if (loading === true) {
      shelvesContent = this.loadingShelves;
    } else {
      shelvesContent = this.homepageShelves;
    }

    return <div className="Home-HomepageShelves">{shelvesContent}</div>;
  }
}

export default (translate()(HomepageShelves): React.ComponentType<Props>);
