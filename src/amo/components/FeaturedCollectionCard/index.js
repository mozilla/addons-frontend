/* @flow */
import * as React from 'react';
import makeClassNames from 'classnames';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
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
  userId: number,
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
      userId,
    } = this.props;

    return (
      <LandingAddonsCard
        addonInstallSource={INSTALL_SOURCE_FEATURED_COLLECTION}
        addons={addons}
        className={makeClassNames(className, {
          'FeaturedCollection--theme': isTheme,
        })}
        header={header}
        footerText={footerText}
        footerLink={`/collections/${userId}/${slug}/`}
        loading={loading}
        isTheme={isTheme}
      />
    );
  }
}
