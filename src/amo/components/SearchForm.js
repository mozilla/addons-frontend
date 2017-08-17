import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  validAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import SearchInput from 'ui/components/SearchInput';

import 'core/css/inc/lib.scss';
import './SearchForm.scss';


export class SearchFormBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string,
    api: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
  }

  static contextTypes = {
    router: PropTypes.object,
  }

  goToSearch(query) {
    const { addonType, api, pathname } = this.props;
    const filters = { query };

    if (addonType) {
      filters.addonType = addonType;
    }

    this.context.router.push({
      pathname: `/${api.lang}/${api.clientApp}${pathname}`,
      query: convertFiltersToQueryParams(filters),
    });
  }

  handleSearch = (e) => {
    e.preventDefault();
    this.searchQuery.input.blur();
    this.goToSearch(this.searchQuery.value);
  }

  render() {
    const { addonType, api, i18n, pathname, query } = this.props;

    let placeholderText;
    if (addonType === ADDON_TYPE_EXTENSION) {
      placeholderText = i18n.gettext('Search extensions');
    } else if (addonType === ADDON_TYPE_THEME) {
      placeholderText = i18n.gettext('Search themes');
    } else {
      placeholderText = i18n.gettext('Search extensions and themes');
    }

    return (
      <form
        method="GET"
        action={`/${api.lang}/${api.clientApp}${pathname}`}
        onSubmit={this.handleSearch}
        className="SearchForm-form"
        ref={(ref) => { this.form = ref; }}
      >
        <label
          className="visually-hidden"
          htmlFor="q"
        >
          {i18n.gettext('Search')}
        </label>
        <SearchInput
          className="SearchForm-query"
          defaultValue={query}
          name="q"
          placeholder={placeholderText}
          ref={(ref) => { this.searchQuery = ref; }}
          type="search"
        />
        <button
          className="visually-hidden"
          onClick={this.handleSearch}
          ref={(ref) => { this.submitButton = ref; }}
          title="Enter"
          type="submit"
        >
          {i18n.gettext('Search')}
        </button>
      </form>
    );
  }
}

export function mapStateToProps(state) {
  return {
    addonType: validAddonTypes.includes(state.viewContext.context) ?
      state.viewContext.context : null,
    api: state.api,
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(SearchFormBase);
