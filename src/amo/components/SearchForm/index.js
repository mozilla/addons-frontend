import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Autosuggest from 'react-autosuggest';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  validAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import SearchInput from 'ui/components/SearchInput';
import LoadingText from 'ui/components/LoadingText';
import { withErrorHandler } from 'core/errorHandler';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import Suggestion from 'amo/components/SearchForm/Suggestion';

import 'core/css/inc/lib.scss';
import './styles.scss';


export class SearchFormBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string,
    api: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    suggestions: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      iconUrl: PropTypes.string.isRequired,
    })).isRequired,
    loadingSuggestions: PropTypes.bool.isRequired,
  }

  static contextTypes = {
    router: PropTypes.object,
  }

  constructor(props: Object) {
    super(props);

    this.state = {
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
      return Array(10).fill('loading-text-will-be-rendered');
    }

    return this.props.suggestions;
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
    this.searchInput.blur();
    this.goToSearch(this.searchInput.value);
  }

  handleSearchChange = (e) => {
    this.setState({ searchValue: e.target.value });
  }

  handleSuggestionsFetchRequested = ({ value }) => {
    if (!value) {
      return;
    }

    const { addonType, dispatch, errorHandler } = this.props;
    const filters = { query: value };

    if (addonType) {
      filters.addonType = addonType;
    }

    dispatch(autocompleteStart({
      errorHandlerId: errorHandler.id,
      filters,
    }));
  }

  handleSuggestionsClearRequested = () => {
    this.props.dispatch(autocompleteCancel());
  }

  handleSuggestionSelected = (e, { suggestion }) => {
    e.preventDefault();
    this.setState({ searchValue: '' }, () => {
      this.context.router.push(suggestion.url);
    });
  }

  renderSuggestion = (suggestion) => {
    if (this.props.loadingSuggestions) {
      return <LoadingText width={60} />;
    }

    const { name, iconUrl } = suggestion;

    return <Suggestion name={name} iconUrl={iconUrl} />;
  }

  render() {
    const { addonType, api, i18n, pathname } = this.props;

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
        <Autosuggest
          className="SearchForm-suggestions"
          focusInputOnSuggestionClick={false}
          getSuggestionValue={(suggestion) => suggestion.name}
          inputProps={{
            value: this.state.searchValue,
            onChange: this.handleSearchChange,
            placeholder: placeholderText,
            className: 'SearchForm-query',
            name: 'q',
            type: 'search',
            inputRef: (ref) => { this.searchInput = ref; },
          }}
          onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
          onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
          onSuggestionSelected={this.handleSuggestionSelected}
          renderSuggestion={this.renderSuggestion}
          renderInputComponent={(inputProps) => <SearchInput {...inputProps} />}
          suggestions={this.getSuggestions()}
          theme={{
            suggestionContainer: 'SearchForm-suggestions',
            suggestionsList: 'SearchForm-suggestions-list',
            suggestion: 'SearchForm-suggestions-item',
            suggestionHighlighted: 'SearchForm-suggestions-item--highlighted',
          }}
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
    suggestions: state.autocomplete.suggestions,
    loadingSuggestions: state.autocomplete.loading,
  };
}

export default compose(
  withErrorHandler({ name: 'SearchForm' }),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(SearchFormBase);
