/* @flow */
import * as React from 'react';
import makeClassNames from 'classnames';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { LANDING_PAGE_THEME_COUNT } from 'amo/constants';
import { INSTALL_SOURCE_FEATURED_COLLECTION } from 'core/constants';
import type { AddonType } from 'core/types/addons';

import './styles.scss';

type Props = {|
  addons: Array<AddonType>,
  className: string,
  footerText: string,
  header: string,
  isTheme: boolean,
  loading: boolean,
  slug: string,
  username: string,
|};

export default class FeaturedCollectionCard extends React.Component<Props> {
  render() {
    const {
      addons,
      className,
      footerText,
      header,
      isTheme,
      loading,
      slug,
      username,
    } = this.props;

    const themeProps = {};

    if (isTheme) {
      themeProps.placeholderCount = LANDING_PAGE_THEME_COUNT;
    }

    return (
      <LandingAddonsCard
        addonInstallSource={INSTALL_SOURCE_FEATURED_COLLECTION}
        addons={addons}
        className={makeClassNames(className, {
          'FeaturedCollection--theme': isTheme,
        })}
        header={header}
        footerText={footerText}
        footerLink={`/collections/${username}/${slug}/`}
        loading={loading}
        {...themeProps}
      />
    );
  }
}
