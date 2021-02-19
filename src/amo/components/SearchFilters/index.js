/* @flow */
import { oneLine } from 'common-tags';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  LINE,
  RECOMMENDED,
  REVIEWED_FILTER,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_RELEVANCE,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_UPDATED,
  VERIFIED_FILTER,
} from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import { convertFiltersToQueryParams, paramsToFilter } from 'amo/searchUtils';
import ExpandableCard from 'amo/components/ExpandableCard';
import Select from 'amo/components/Select';
import type { AppState } from 'amo/store';
import type { SearchFilters as SearchFiltersType } from 'amo/api/search';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterHistoryType } from 'amo/types/router';

import './styles.scss';

export const NO_FILTER = '';
const sortSelectName = paramsToFilter.sort;

type Props = {|
  filters: SearchFiltersType,
  pathname: string,
|};

type InternalProps = {|
  ...Props,
  clientApp: string,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  lang: string,
|};

export class SearchFiltersBase extends React.Component<InternalProps> {
  onSelectElementChange: (
    event: SyntheticEvent<HTMLSelectElement>,
  ) => boolean = (event: SyntheticEvent<HTMLSelectElement>) => {
    event.preventDefault();

    const { filters } = this.props;
    const newFilters = { ...filters };

    // Get the filter we're supposed to change and set it.
    const filterName = event.currentTarget.getAttribute('name');
    const filterValue = event.currentTarget.value;

    if (filterName) {
      // If we are currently filtering by category, and the filter to change is 'sort',
      // force recommendations to the top.
      // See https://github.com/mozilla/addons-frontend/issues/8084
      if (
        newFilters.category &&
        filterName === sortSelectName &&
        filterValue !== SEARCH_SORT_RECOMMENDED
      ) {
        newFilters[filterName] = `${SEARCH_SORT_RECOMMENDED},${filterValue}`;
      } else {
        newFilters[filterName] = filterValue;
      }

      // If the filters haven't changed we're not going to change the URL.
      if (newFilters[filterName] === filters[filterName]) {
        log.debug(oneLine`onSelectElementChange() called in SearchFilters but
        the filter ${filterName} did not change–not changing route.`);
        return false;
      }

      if (newFilters[filterName] === NO_FILTER) {
        delete newFilters[filterName];
      }
    }

    // We cannot pass `sort=random` without `promoted`.
    // See: https://github.com/mozilla/addons-frontend/issues/8301
    if (
      !newFilters.promoted &&
      newFilters.sort &&
      newFilters.sort === SEARCH_SORT_RANDOM
    ) {
      delete newFilters.sort;
    }

    this.doSearch(newFilters);

    return false;
  };

  doSearch(newFilters: SearchFiltersType) {
    const { clientApp, lang, history, pathname } = this.props;

    if (newFilters.page) {
      // Since it's now a new search, reset the page.
      // eslint-disable-next-line
      newFilters.page = '1';
    }

    history.push({
      pathname: `/${lang}/${clientApp}${pathname}`,
      query: convertFiltersToQueryParams(newFilters),
    });
  }

  addonTypeOptions(): Array<{| children: string, value: string |}> {
    const { i18n } = this.props;

    const options = [
      { children: i18n.gettext('All'), value: NO_FILTER },
      { children: i18n.gettext('Extension'), value: ADDON_TYPE_EXTENSION },
    ];

    options.push({
      children: i18n.gettext('Theme'),
      value: ADDON_TYPE_STATIC_THEME,
    });

    return options;
  }

  sortOptions(): Array<{| children: string, value: string |}> {
    const { i18n } = this.props;

    return [
      { children: i18n.gettext('Relevance'), value: SEARCH_SORT_RELEVANCE },
      {
        children: i18n.gettext('Recently Updated'),
        value: SEARCH_SORT_UPDATED,
      },
      { children: i18n.gettext('Most Users'), value: SEARCH_SORT_POPULAR },
      { children: i18n.gettext('Top Rated'), value: SEARCH_SORT_TOP_RATED },
      { children: i18n.gettext('Trending'), value: SEARCH_SORT_TRENDING },
    ];
  }

  promotedOptions(): Array<{| children: string, value: string |}> {
    const { i18n } = this.props;

    return [
      { children: i18n.gettext('Any'), value: NO_FILTER },
      { children: i18n.gettext('Recommended'), value: RECOMMENDED },
      {
        children: i18n.gettext('By Firefox'),
        value: LINE,
      },
      {
        children: i18n.gettext('Verified'),
        value: VERIFIED_FILTER,
      },
      {
        children: i18n.gettext('All Reviewed'),
        value: REVIEWED_FILTER,
      },
    ];
  }

  render(): React.Node {
    const { clientApp, filters, i18n } = this.props;

    const expandableCardName = 'SearchFilters';
    const selectedSortFields = filters.sort
      ? filters.sort
          .split(',')
          .filter((field) => field !== SEARCH_SORT_RECOMMENDED)
      : [''];
    const selectedSort = selectedSortFields[0];

    return (
      <ExpandableCard
        className={expandableCardName}
        header={i18n.gettext('Filter results')}
        id={expandableCardName}
      >
        <form autoComplete="off">
          <label className="SearchFilters-label" htmlFor="SearchFilters-Sort">
            {i18n.gettext('Sort by')}
          </label>
          <Select
            className="SearchFilters-Sort SearchFilters-select"
            id="SearchFilters-Sort"
            name={sortSelectName}
            onChange={this.onSelectElementChange}
            value={selectedSort || SEARCH_SORT_RELEVANCE}
          >
            {this.sortOptions().map((option) => {
              return <option key={option.value} {...option} />;
            })}
          </Select>

          {/* Categories are linked to addonType so we don't allow changing the
            addonType if a category is set. Also, hide the addonType filter on Android. */}
          {!filters.category && clientApp !== CLIENT_APP_ANDROID && (
            <div>
              <label
                className="SearchFilters-AddonType-label SearchFilters-label"
                htmlFor="SearchFilters-AddonType"
              >
                {i18n.gettext('Add-on Type')}
              </label>
              <Select
                className="SearchFilters-AddonType SearchFilters-select"
                id="SearchFilters-AddonType"
                name="addonType"
                onChange={this.onSelectElementChange}
                value={filters.addonType || NO_FILTER}
              >
                {this.addonTypeOptions().map((option) => {
                  return <option key={option.value} {...option} />;
                })}
              </Select>
            </div>
          )}

          {/* Hide the badging filter on Android. */}
          {clientApp !== CLIENT_APP_ANDROID && (
            <div>
              <label
                className="SearchFilters-Badging-label SearchFilters-label"
                htmlFor="SearchFilters-Badging"
              >
                {i18n.gettext('Badging')}
              </label>
              <Select
                className="SearchFilters-Badging SearchFilters-select"
                id="SearchFilters-Badging"
                name="promoted"
                onChange={this.onSelectElementChange}
                value={filters.promoted || NO_FILTER}
              >
                {this.promotedOptions().map((option) => {
                  return <option key={option.value} {...option} />;
                })}
              </Select>
            </div>
          )}
        </form>
      </ExpandableCard>
    );
  }
}

export function mapStateToProps(
  state: AppState,
): {|
  clientApp: null | string,
  filters: null | SearchFiltersType,
  lang: null | string,
|} {
  return {
    clientApp: state.api.clientApp,
    filters: state.search.filters,
    lang: state.api.lang,
  };
}

const SearchFilters: any = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'SearchFilters' }),
)(SearchFiltersBase);

export default SearchFilters;
