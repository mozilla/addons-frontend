import { oneLine } from 'common-tags';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import ExpandableCard from 'ui/components/ExpandableCard';

import './styles.scss';

const NO_FILTER = '';

export class SearchFiltersBase extends React.Component {
  static propTypes = {
    clientApp: PropTypes.string.isRequired,
    filters: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    pathname: PropTypes.string.isRequired,
    router: PropTypes.object.isRequired,
  };

  onSelectElementChange = event => {
    event.preventDefault();

    const { clientApp, filters, lang, pathname, router } = this.props;
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

    // TODO: We do this in a few places; make a helper for it.
    router.push({
      pathname: `/${lang}/${clientApp}${pathname}`,
      query: convertFiltersToQueryParams(newFilters),
    });

    return false;
  };

  addonTypeOptions() {
    const { i18n } = this.props;

    return [
      { children: i18n.gettext('All'), value: NO_FILTER },
      { children: i18n.gettext('Extension'), value: ADDON_TYPE_EXTENSION },
      { children: i18n.gettext('Theme'), value: ADDON_TYPE_THEME },
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
      { children: i18n.gettext('Relevance'), value: 'relevance' },
      { children: i18n.gettext('Recently Updated'), value: 'updated' },
      { children: i18n.gettext('Most Users'), value: 'users' },
      { children: i18n.gettext('Top Rated'), value: 'rating' },
    ];
  }

  render() {
    const { filters, i18n } = this.props;

    return (
      <ExpandableCard
        className="SearchFilters"
        header={i18n.gettext('Filter results')}
      >
        <label className="SearchFilters-label" htmlFor="SearchFilters-Sort">
          {i18n.gettext('Sort by')}
        </label>
        <select
          className="SearchFilters-select"
          id="SearchFilters-Sort"
          name="sort"
          onChange={this.onSelectElementChange}
          value={filters.sort || 'relevance'}
        >
          {this.sortOptions().map(option => {
            return <option key={option.name} {...option} />;
          })}
        </select>

        <label
          className="SearchFilters-AddonType-label SearchFilters-label"
          htmlFor="SearchFilters-AddonType"
        >
          {i18n.gettext('Add-on Type')}
        </label>
        <select
          className="SearchFilters-AddonType SearchFilters-select"
          id="SearchFilters-AddonType"
          name="addonType"
          onChange={this.onSelectElementChange}
          value={filters.addonType || NO_FILTER}
        >
          {this.addonTypeOptions().map(option => {
            return <option key={option.name} {...option} />;
          })}
        </select>

        <label
          className="SearchFilters-OperatingSystem-label SearchFilters-label"
          htmlFor="SearchFilters-OperatingSystem"
        >
          {i18n.gettext('Operating System')}
        </label>
        <select
          className="SearchFilters-OperatingSystem SearchFilters-select"
          id="SearchFilters-OperatingSystem"
          name="operatingSystem"
          onChange={this.onSelectElementChange}
          value={filters.operatingSystem || NO_FILTER}
        >
          {this.operatingSystemOptions().map(option => {
            return <option key={option.name} {...option} />;
          })}
        </select>
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

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Search' })
)(SearchFiltersBase);
