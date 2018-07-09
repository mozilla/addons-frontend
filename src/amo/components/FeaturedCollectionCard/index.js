/* @flow */
import * as React from 'react';

import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { INSTALL_SOURCE_FEATURED_COLLECTION } from 'core/constants';
import type { AddonType } from 'core/types/addons';

export type LandingCardCollectionMetadata = {|
  footerText: string,
  header: string,
  slug: string,
  username: string,
|};

type Props = {|
  addons: Array<AddonType>,
  className: string,
  collectionMetadata: LandingCardCollectionMetadata,
  loading: boolean,
|};

export default class FeaturedCollectionCard extends React.Component<Props> {
  render() {
    const { addons, className, collectionMetadata, loading } = this.props;

    return (
      <LandingAddonsCard
        addonInstallSource={INSTALL_SOURCE_FEATURED_COLLECTION}
        addons={addons}
        className={className}
        header={collectionMetadata.header}
        footerText={collectionMetadata.footerText}
        footerLink={`/collections/${collectionMetadata.username}/${
          collectionMetadata.slug
        }/`}
        loading={loading}
      />
    );
  }
}
