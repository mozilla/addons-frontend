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
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RELEVANCE,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_UPDATED,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import { getAddonTypeFilter } from 'core/utils';
import ExpandableCard from 'ui/components/ExpandableCard';
import Select from 'ui/components/Select';

import './styles.scss';

const NO_FILTER = '';

export class SearchFiltersBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    filters: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
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
    newFilters[filterName] = event.currentTarget.value;

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
    const { filters } = this.props;
    const newFilters = { ...filters };

    // When a checkbox changes, we want to invert its previous value.
    // If it was checked, then we remove the filter since the API only supports
    // `featured=true`, otherwise we set this filter.
    if (filters.featured) {
      delete newFilters.featured;
    } else {
      newFilters.featured = true;
    }

    this.doSearch({ newFilters });
  };

  doSearch({ newFilters }) {
    const { location, history } = this.props;

    if (newFilters.page) {
      // Since it's now a new search, reset the page.
      // eslint-disable-next-line
      newFilters.page = 1;
    }

    history.push({
      pathname: location.pathname,
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
        value: getAddonTypeFilter(ADDON_TYPE_THEME, {
          _config: this.props._config,
        }),
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
    const { filters, i18n } = this.props;

    return (
      <ExpandableCard
        className="SearchFilters"
        header={i18n.gettext('Filter results')}
      >
        <form autoComplete="off">
          <label className="SearchFilters-label" htmlFor="SearchFilters-Sort">
            {i18n.gettext('Sort by')}
          </label>
          <Select
            className="SearchFilters-select"
            id="SearchFilters-Sort"
            name="sort"
            onChange={this.onSelectElementChange}
            value={filters.sort || 'relevance'}
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
            className="SearchFilters-label SearchFilters-Featured-label"
            htmlFor="SearchFilters-Featured"
          >
            <input
              className="SearchFilters-Featured"
              checked={!!filters.featured}
              id="SearchFilters-Featured"
              name="featured"
              onChange={this.onChangeCheckbox}
              type="checkbox"
            />
            {i18n.gettext('Featured add-ons only')}
          </label>
        </form>
      </ExpandableCard>
    );
  }
}

export function mapStateToProps(state) {
  return {
    filters: state.search.filters,
  };
}

const SearchFilters = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'SearchFilters' }),
)(SearchFiltersBase);

export default SearchFilters;
