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
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import Select from 'amo/components/Select';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterHistoryType } from 'amo/types/router';

import './styles.scss';

export type Props = {|
  collection: CollectionType | null,
  editing: boolean,
  filters: CollectionFilters,
|};

type PropsFromState = {|
  clientApp: string,
  lang: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  clientApp: string,
  jed: I18nType,
  lang: string,
  history: ReactRouterHistoryType,
|};

type SortOption = {| label: string, value: string |};

export class CollectionSortBase extends React.Component<InternalProps> {
  onSortSelect: (event: SyntheticEvent<HTMLSelectElement>) => void = (
    event: SyntheticEvent<HTMLSelectElement>,
  ) => {
    const { collection, clientApp, editing, filters, lang, history } =
      this.props;

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

  sortOptions(): Array<SortOption> {
    const { jed } = this.props;

    return [
      {
        label: jed.gettext('Newest first'),
        value: COLLECTION_SORT_DATE_ADDED_DESCENDING,
      },
      {
        label: jed.gettext('Oldest first'),
        value: COLLECTION_SORT_DATE_ADDED_ASCENDING,
      },
      {
        label: jed.gettext('Name'),
        value: COLLECTION_SORT_NAME,
      },
      {
        label: jed.gettext('Popularity'),
        value: COLLECTION_SORT_POPULARITY_DESCENDING,
      },
    ];
  }

  render(): React.Node {
    const { filters, jed } = this.props;

    return (
      <form className="CollectionSort">
        <label className="CollectionSort-label" htmlFor="CollectionSort-select">
          {jed.gettext('Sort add-ons by')}
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

const mapStateToProps = (state: AppState): PropsFromState => {
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
