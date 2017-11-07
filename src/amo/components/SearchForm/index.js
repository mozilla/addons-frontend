import classNames from 'classnames';
import { oneLine } from 'common-tags';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Autosuggest from 'react-autosuggest';
import { withRouter } from 'react-router';
import defaultDebounce from 'lodash.debounce';
import deepEqual from 'deep-eql';

import Suggestion from 'amo/components/SearchSuggestion';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  ADDON_TYPE_THEME,
  validAddonTypes,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { getAddonIconUrl } from 'core/imageUtils';
import log from 'core/logger';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import {
  convertOSToFilterValue,
  convertFiltersToQueryParams,
} from 'core/searchUtils';
import Icon from 'ui/components/Icon';

import './styles.scss';

export const SEARCH_TERM_MAX_LENGTH = 100;
export const AUTO_SUGGEST_MIN_LENGTH = 2;
export class SearchFormBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string,
    api: PropTypes.object.isRequired,
    className: PropTypes.string,
    debounce: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    loadingSuggestions: PropTypes.bool.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    router: PropTypes.object.isRequired,
    suggestions: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      iconUrl: PropTypes.string.isRequired,
    })).isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  }

  static defaultProps = {
    debounce: defaultDebounce,
  };

  constructor(props: Object) {
    super(props);

    this.state = {
      autocompleteIsOpen: false,
      oldAutocompleteFilters: {},
      searchValue: props.query || '',
    };
  }

  componentWillReceiveProps(nextProps) {
    const { query } = nextProps;

    if (this.props.query !== query) {
      this.setState({ searchValue: query || '' });
    }
  }

  getSuggestions() {
    if (this.props.loadingSuggestions) {
      // 10 is the maximum number of results returned by the API
      return Array(10).fill({
        name: this.props.i18n.gettext('Loading'),
        iconUrl: getAddonIconUrl(),
        loading: true,
      });
    }

    return this.props.suggestions.map((suggestion) => ({
      ...suggestion,
      loading: false,
    }));
  }

  createFiltersFromQuery(newFilters) {
    const { addonType, userAgentInfo } = this.props;
    const filters = { ...newFilters };

    if (addonType) {
      filters.addonType = addonType;
    }

    filters.operatingSystem = convertOSToFilterValue(
      userAgentInfo.os.name);

    return filters;
  }

  goToSearch(query) {
    const { api, pathname, router } = this.props;
    const filters = this.createFiltersFromQuery({ query });

    router.push({
      pathname: `/${api.lang}/${api.clientApp}${pathname}`,
      query: convertFiltersToQueryParams(filters),
    });
  }

  handleSearch = (event) => {
    event.preventDefault();

    this.autosuggest.input.blur();
    this.goToSearch(this.autosuggest.input.value);
  }

  handleSearchChange = (event) => {
    const searchValue = event.target.value || '';
    if (searchValue.trim().length <= SEARCH_TERM_MAX_LENGTH) {
      this.setState({ searchValue });
    }
  }

  dispatchAutocompleteStart = this.props.debounce(({ filters }) => {
    const { dispatch, errorHandler } = this.props;

    dispatch(autocompleteStart({
      errorHandlerId: errorHandler.id,
      filters,
    }));
  }, 200, { trailing: true })

  handleSuggestionsFetchRequested = ({ value, reason }) => {
    if (!value) {
      log.debug(oneLine`Ignoring suggestions fetch requested because value
        is not supplied: ${value}`);
      return;
    }

    if (value.length > SEARCH_TERM_MAX_LENGTH) {
      log.debug(oneLine`SEARCH_TERM_MAX_LENGTH: ${SEARCH_TERM_MAX_LENGTH} exceeds`);
      return;
    }

    const filters = this.createFiltersFromQuery({ query: value });

    this.setState({
      autocompleteIsOpen: true,
      oldAutocompleteFilters: filters,
    });

    if (
      // See: https://github.com/moroshko/react-autosuggest#onsuggestionsfetchrequested-required.
      reason === 'input-focused' &&
      deepEqual(filters, this.state.oldAutocompleteFilters)
    ) {
      log.debug(oneLine`No autocomplete start dispatched: search input focused
        but filters have not changed.`);
      return;
    }

    this.dispatchAutocompleteStart({ filters });
  }

  handleSuggestionsClearRequested = () => {
    this.setState({ autocompleteIsOpen: false });
    this.props.dispatch(autocompleteCancel());
  }

  handleSuggestionSelected = (e, { suggestion }) => {
    e.preventDefault();

    if (suggestion.loading) {
      log.debug('Ignoring loading suggestion selected');
      return;
    }

    this.setState({ autocompleteIsOpen: false, searchValue: '' });
    this.props.router.push(suggestion.url);
  }

  shouldRenderSuggestions = (value) => {
    return value.trim().length > AUTO_SUGGEST_MIN_LENGTH;
  }

  renderSuggestion = (suggestion) => {
    const { name, iconUrl, loading } = suggestion;

    return (
      <Suggestion
        name={name}
        iconUrl={iconUrl}
        loading={loading}
        arrowAlt={this.props.i18n.gettext('Go to the add-on page')}
      />
    );
  }

  render() {
    const {
      addonType,
      api,
      className,
      i18n,
      pathname,
    } = this.props;

    let placeholderText;
    if (addonType === ADDON_TYPE_EXTENSION) {
      placeholderText = i18n.gettext('Find extensions');
    } else if (addonType === ADDON_TYPE_DICT) {
      placeholderText = i18n.gettext('Find dictionary');
    } else if (addonType === ADDON_TYPE_LANG) {
      placeholderText = i18n.gettext('Find language pack');
    } else if (addonType === ADDON_TYPE_THEME) {
      placeholderText = i18n.gettext('Find themes');
    } else {
      placeholderText = i18n.gettext('Find add-ons');
    }

    const inputProps = {
      className: 'SearchForm-query',
      maxLength: SEARCH_TERM_MAX_LENGTH,
      name: 'q',
      onChange: this.handleSearchChange,
      placeholder: placeholderText,
      type: 'search',
      value: this.state.searchValue,
    };

    const autocompleteIsOpen = this.state.autocompleteIsOpen &&
      // This prevents the input to look like Autosuggest is open when
      // there is no result coming from the API.
      this.getSuggestions().length > 0;

    return (
      <form
        action={`/${api.lang}/${api.clientApp}${pathname}`}
        className={classNames('SearchForm', className, {
          'SearchForm--autocompleteIsOpen': autocompleteIsOpen,
        })}
        method="GET"
        onSubmit={this.handleSearch}
        ref={(ref) => { this.form = ref; }}
        data-no-csrf
      >
        <label
          className="visually-hidden"
          htmlFor={inputProps.name}
        >
          {i18n.gettext('Search')}
        </label>
        <Icon
          className="SearchForm-icon-magnifying-glass"
          name="magnifying-glass"
        />
        <Autosuggest
          className="SearchForm-suggestions"
          focusInputOnSuggestionClick={false}
          getSuggestionValue={(suggestion) => suggestion.name}
          inputProps={inputProps}
          shouldRenderSuggestions={this.shouldRenderSuggestions}
          onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
          onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
          onSuggestionSelected={this.handleSuggestionSelected}
          ref={(ref) => { this.autosuggest = ref; }}
          renderSuggestion={this.renderSuggestion}
          suggestions={this.getSuggestions()}
          theme={{
            suggestionContainer: 'SearchForm-suggestions',
            suggestionsList: 'SearchForm-suggestions-list',
            suggestion: 'SearchForm-suggestions-item',
            suggestionHighlighted: 'SearchForm-suggestions-item--highlighted',
          }}
        />
        <button
          className="SearchForm-submit-button"
          onClick={this.handleSearch}
          ref={(ref) => { this.submitButton = ref; }}
          type="submit"
        >
          <span className="visually-hidden">{i18n.gettext('Search')}</span>
          <Icon
            className="SearchForm-icon-arrow"
            name="arrow"
          />
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
    suggestions: state.autocomplete.suggestions,
    loadingSuggestions: state.autocomplete.loading,
    userAgentInfo: state.api.userAgentInfo,
  };
}

export default compose(
  withRouter,
  withErrorHandler({ name: 'SearchForm' }),
  connect(mapStateToProps),
  translate(),
)(SearchFormBase);
