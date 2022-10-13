import * as React from 'react';

import CollectionSort from 'amo/components/CollectionSort';
import Card from 'amo/components/Card';
import type { CollectionFilters, CollectionType } from 'amo/reducers/collections';
import './styles.scss';

export type Props = {
  collection: CollectionType | null;
  editing: boolean;
  filters: CollectionFilters;
};
export default class CollectionControls extends React.Component<Props> {
  render(): React.ReactNode {
    const {
      collection,
      editing,
      filters,
    } = this.props;
    return <Card className="CollectionControls">
        <CollectionSort collection={collection} editing={editing} filters={filters} />
      </Card>;
  }

}