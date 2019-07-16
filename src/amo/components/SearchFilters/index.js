import { oneLine } from 'common-tags';
import config from 'config';
import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_RELEVANCE,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_UPDATED,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams, paramsToFilter } from 'core/searchUtils';
import ExpandableCard from 'ui/components/ExpandableCard';
import Select from 'ui/components/Select';

import './styles.scss';

const NO_FILTER = '';
const sortSelectName = paramsToFilter.sort;

export class SearchFiltersBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    clientApp: PropTypes.string.isRequired,
    filters: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    pathname: PropTypes.string.isRequired,
  };

  static defaultProps = {
    _config: config,
  };

  onSelectElementChange = (event) => {
    event.preventDefault();

    const { filters } = this.props;
    const newFilters = { ...filters };

    // Get the filter we're supposed to change and set it.
    const filterName = event.currentTarget.getAttribute('name');
    const filterValue = event.currentTarget.value;

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

    this.doSearch({ newFilters });

    return false;
  };

  onChangeCheckbox = () => {
    const { _config, filters } = this.props;
    const newFilters = { ...filters };

    // When a checkbox changes, we want to invert its previous value.
    // If it was checked, then we remove the filter since the API only supports
    // `recommended=true`, otherwise we set this filter.
    const filterName = _config.get('enableFeatureRecommendedBadges')
      ? 'recommended'
      : 'featured';

    if (filters[filterName]) {
      delete newFilters[filterName];

      // We cannot pass `sort=random` without `recommended` or `featured`.
      // Given that we deleted the filter above, we also have to delete
      // `sort=random`.
      // See: https://github.com/mozilla/addons-frontend/issues/8301
      if (newFilters.sort && newFilters.sort === SEARCH_SORT_RANDOM) {
        delete newFilters.sort;
      }
    } else {
      newFilters[filterName] = true;
    }

    this.doSearch({ newFilters });
  };

  doSearch({ newFilters }) {
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

  addonTypeOptions() {
    const { i18n } = this.props;

    return [
      { children: i18n.gettext('All'), value: NO_FILTER },
      { children: i18n.gettext('Extension'), value: ADDON_TYPE_EXTENSION },
      { children: i18n.gettext('Search Tool'), value: ADDON_TYPE_OPENSEARCH },
      {
        children: i18n.gettext('Theme'),
        value: ADDON_TYPE_STATIC_THEME,
      },
    ];
  }

  operatingSystemOptions() {
    const { i18n } = this.props;

    return [
      { children: i18n.gettext('All'), value: NO_FILTER },
      { children: i18n.gettext('Windows'), value: OS_WINDOWS },
      { children: i18n.gettext('macOS'), value: OS_MAC },
      { children: i18n.gettext('Linux'), value: OS_LINUX },
    ];
  }

  sortOptions() {
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

  render() {
    const { _config, filters, i18n } = this.props;

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
            addonType if a category is set. */}
          {!filters.category && (
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

          <label
            className="SearchFilters-OperatingSystem-label SearchFilters-label"
            htmlFor="SearchFilters-OperatingSystem"
          >
            {i18n.gettext('Operating System')}
          </label>
          <Select
            className="SearchFilters-OperatingSystem SearchFilters-select"
            id="SearchFilters-OperatingSystem"
            name="operatingSystem"
            onChange={this.onSelectElementChange}
            value={filters.operatingSystem || NO_FILTER}
          >
            {this.operatingSystemOptions().map((option) => {
              return <option key={option.value} {...option} />;
            })}
          </Select>

          <label
            className="SearchFilters-label SearchFilters-Recommended-label"
            htmlFor="SearchFilters-Recommended"
          >
            <input
              className="SearchFilters-Recommended"
              checked={
                _config.get('enableFeatureRecommendedBadges')
                  ? !!filters.recommended
                  : !!filters.featured
              }
              id="SearchFilters-Recommended"
              name="recommended"
              onChange={this.onChangeCheckbox}
              type="checkbox"
            />
            {_config.get('enableFeatureRecommendedBadges')
              ? i18n.gettext('Recommended add-ons only')
              : i18n.gettext('Featured add-ons only')}
          </label>
        </form>
      </ExpandableCard>
    );
  }
}

export function mapStateToProps(state) {
  return {
    clientApp: state.api.clientApp,
    filters: state.search.filters,
    lang: state.api.lang,
  };
}

const SearchFilters = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'SearchFilters' }),
)(SearchFiltersBase);

export default SearchFilters;
