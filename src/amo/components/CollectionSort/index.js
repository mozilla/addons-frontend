/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  collectionEditUrl,
  collectionUrl,
  convertFiltersToQueryParams,
} from 'amo/reducers/collections';
import {
  COLLECTION_SORT_DATE_ADDED_ASCENDING,
  COLLECTION_SORT_DATE_ADDED_DESCENDING,
  COLLECTION_SORT_NAME,
  COLLECTION_SORT_POPULARITY_DESCENDING,
} from 'core/constants';
import translate from 'core/i18n/translate';
import Select from 'ui/components/Select';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterHistoryType } from 'core/types/router';

import './styles.scss';

export type Props = {|
  collection: CollectionType | null,
  editing: boolean,
  filters: CollectionFilters,
|};

type InternalProps = {|
  ...Props,
  clientApp: string,
  i18n: I18nType,
  lang: string,
  history: ReactRouterHistoryType,
|};

export class CollectionSortBase extends React.Component<InternalProps> {
  onSortSelect = (event: SyntheticEvent<HTMLSelectElement>) => {
    const {
      clientApp,
      collection,
      editing,
      filters,
      history,
      lang,
    } = this.props;

    invariant(collection, 'A collection is required.');

    const collectionSort = event.currentTarget.value;
    const newFilters = {
      ...filters,
      collectionSort,
    };

    const pathname = `/${lang}/${clientApp}${
      editing
        ? collectionEditUrl({ collection })
        : collectionUrl({ collection })
    }`;
    history.push({
      pathname,
      query: convertFiltersToQueryParams(newFilters),
    });
  };

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
        value: COLLECTION_SORT_POPULARITY_DESCENDING,
      },
    ];
  }

  render() {
    const { filters, i18n } = this.props;

    return (
      <form className="CollectionSort">
        <label className="CollectionSort-label" htmlFor="CollectionSort-select">
          {i18n.gettext('Sort add-ons by')}
        </label>
        <Select
          className="CollectionSort-select"
          defaultValue={filters.collectionSort}
          id="CollectionSort-select"
          name="sort"
          onChange={this.onSortSelect}
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
    );
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
};

const CollectionSort: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(CollectionSortBase);

export default CollectionSort;
