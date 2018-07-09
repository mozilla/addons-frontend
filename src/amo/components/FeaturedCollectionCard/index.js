/* @flow */
import * as React from 'react';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { INSTALL_SOURCE_FEATURED_COLLECTION } from 'core/constants';
import type { AddonType } from 'core/types/addons';

type Props = {|
  addons: Array<AddonType>,
  className: string,
  footerText: string,
  header: string,
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
      loading,
      slug,
      username,
    } = this.props;

    return (
      <LandingAddonsCard
        addonInstallSource={INSTALL_SOURCE_FEATURED_COLLECTION}
        addons={addons}
        className={className}
        header={header}
        footerText={footerText}
        footerLink={`/collections/${username}/${slug}/`}
        loading={loading}
      />
    );
  }
}
