/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import {
  COLLECTION_SORT_DATE_ADDED_ASCENDING,
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  COLLECTION_SORT_NAME,
  COLLECTION_SORT_POPULARITY,
} from 'core/constants';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Select from 'ui/components/Select';
import type { CollectionFilters } from 'amo/reducers/collections';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export type Props = {|
  filters: CollectionFilters,
  onSortSelect: (event: SyntheticEvent<HTMLSelectElement>) => void,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class CollectionSortBase extends React.Component<InternalProps> {
  sortOptions() {
    const { i18n } = this.props;

    return [
      {
        label: i18n.gettext('Newest first'),
        value: COLLECTION_SORT_DATE_ADDED_DESCENDING,
      },
      {
        label: i18n.gettext('Oldest first'),
        value: COLLECTION_SORT_DATE_ADDED_ASCENDING,
      },
      {
        label: i18n.gettext('Name'),
        value: COLLECTION_SORT_NAME,
      },
      {
        label: i18n.gettext('Popularity'),
        value: COLLECTION_SORT_POPULARITY,
      },
    ];
  }

  render() {
    const { filters, i18n, onSortSelect } = this.props;

    return (
      <Card className="CollectionSort">
        <form>
          <label className="CollectionSort-label" htmlFor="Sort-Select">
            {i18n.gettext('Sort add-ons by')}
          </label>
          <Select
            className="CollectionSort-select"
            defaultValue={filters.collectionSort}
            id="CollectionSort-select"
            name="sort"
            onChange={onSortSelect}
          >
            {this.sortOptions().map((option) => {
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </Select>
        </form>
      </Card>
    );
  }
}

const CollectionSort: React.ComponentType<Props> = compose(translate())(
  CollectionSortBase,
);

export default CollectionSort;
