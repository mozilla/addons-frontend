import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Autosuggest from 'react-autosuggest';
import { withRouter } from 'react-router';
import defaultDebounce from 'simple-debounce';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  validAddonTypes,
} from 'core/constants';
import log from 'core/logger';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import SearchInput from 'ui/components/SearchInput';
import { withErrorHandler } from 'core/errorHandler';
import { getAddonIconUrl } from 'core/imageUtils';
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
    suggestions: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        iconUrl: PropTypes.string.isRequired,
      })
    ).isRequired,
    loadingSuggestions: PropTypes.bool.isRequired,
    router: PropTypes.object.isRequired,
    debounce: PropTypes.func.isRequired,
  };

  static defaultProps = {
    debounce: defaultDebounce,
  };

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
      // 10 is the maximum number of results returned by the API
      return Array(10).fill({
        name: this.props.i18n.gettext('Loading'),
        iconUrl: getAddonIconUrl(),
        loading: true,
      });
    }

    return this.props.suggestions.map(suggestion => ({
      ...suggestion,
      loading: false,
    }));
  }

  goToSearch(query) {
    const { addonType, api, pathname, router } = this.props;
    const filters = { query };

    if (addonType) {
      filters.addonType = addonType;
    }

    router.push({
      pathname: `/${api.lang}/${api.clientApp}${pathname}`,
      query: convertFiltersToQueryParams(filters),
    });
  }

  handleSearch = e => {
    e.preventDefault();
    this.searchInput.blur();
    this.goToSearch(this.searchInput.value);
  };

  handleSearchChange = e => {
    this.setState({ searchValue: e.target.value });
  };

  handleSuggestionsFetchRequested = this.props.debounce(({ value }) => {
    if (!value) {
      log.debug(
        `Ignoring suggestions fetch requested because value is not supplied: ${value}`
      );
      return;
    }

    const { addonType, dispatch, errorHandler } = this.props;
    const filters = { query: value };

    if (addonType) {
      filters.addonType = addonType;
    }

    dispatch(
      autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters,
      })
    );
  }, 200);

  handleSuggestionsClearRequested = () => {
    this.props.dispatch(autocompleteCancel());
  };

  handleSuggestionSelected = (e, { suggestion }) => {
    e.preventDefault();

    if (suggestion.loading) {
      log.debug('Ignoring loading suggestion selected');
      return;
    }

    this.setState({ searchValue: '' }, () => {
      this.props.router.push(suggestion.url);
    });
  };

  renderSuggestion = suggestion => {
    const { name, iconUrl, loading } = suggestion;

    return (
      <Suggestion
        name={name}
        iconUrl={iconUrl}
        loading={loading}
        arrowAlt={this.props.i18n.gettext('Go to the add-on page')}
      />
    );
  };

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

    const inputProps = {
      value: this.state.searchValue,
      onChange: this.handleSearchChange,
      placeholder: placeholderText,
      className: 'SearchForm-query',
      name: 'q',
      type: 'search',
      inputRef: ref => {
        this.searchInput = ref;
      },
    };

    return (
      <form
        method="GET"
        action={`/${api.lang}/${api.clientApp}${pathname}`}
        onSubmit={this.handleSearch}
        className="SearchForm-form"
        ref={ref => {
          this.form = ref;
        }}
      >
        <label className="visually-hidden" htmlFor={inputProps.name}>
          {i18n.gettext('Search')}
        </label>
        <Autosuggest
          className="SearchForm-suggestions"
          focusInputOnSuggestionClick={false}
          getSuggestionValue={suggestion => suggestion.name}
          inputProps={inputProps}
          onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
          onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
          onSuggestionSelected={this.handleSuggestionSelected}
          renderSuggestion={this.renderSuggestion}
          renderInputComponent={props => <SearchInput {...props} />}
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
          ref={ref => {
            this.submitButton = ref;
          }}
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
    addonType: validAddonTypes.includes(state.viewContext.context)
      ? state.viewContext.context
      : null,
    api: state.api,
    suggestions: state.autocomplete.suggestions,
    loadingSuggestions: state.autocomplete.loading,
  };
}

export default compose(
  withRouter,
  withErrorHandler({ name: 'SearchForm' }),
  connect(mapStateToProps),
  translate({ withRef: true })
)(SearchFormBase);
