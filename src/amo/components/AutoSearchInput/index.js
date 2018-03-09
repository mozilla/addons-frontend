/* @flow */
/* eslint-disable react/sort-comp, react/no-unused-prop-types */
import { oneLine } from 'common-tags';
import makeClassName from 'classnames';
import invariant from 'invariant';
import defaultDebounce from 'lodash.debounce';
import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';

import SearchSuggestion from 'amo/components/SearchSuggestion';
import { withFixedErrorHandler } from 'core/errorHandler';
import { getAddonIconUrl } from 'core/imageUtils';
import log from 'core/logger';
import {
  convertOSToFilterValue, convertQueryParamsToFilters,
} from 'core/searchUtils';
import translate from 'core/i18n/translate';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import Icon from 'ui/components/Icon';
import type { ApiStateType, UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';
import type { ErrorHandlerType } from 'core/errorHandler';

import './styles.scss';

export const SEARCH_TERM_MAX_LENGTH = 100;

type SuggestionType = {|
  iconUrl: string,
  loading: boolean,
  name: string,
  url: string,
|};

type Props = {|
  errorHandler: ErrorHandlerType,
  debounce: typeof defaultDebounce,
  dispatch: DispatchFunc,
  i18n: I18nType,
  // This is the name property of the <input> tag.
  inputName: string,
  inputPlaceholder?: string,
  loadingSuggestions: boolean,
  location: ReactRouterLocation,
  // TODO: type
  onSearch: (searchFilters: Object) => void,
  onSuggestionSelected: (SuggestionType) => void,
  query?: string,
  // This is optional accessibility text for the icon associated with
  // selecting a search suggestion from the list.
  selectSuggestionText?: string,
  suggestions: Array<SuggestionType>,
  userAgentInfo: UserAgentInfoType,
|};

type State = {|
  autocompleteIsOpen: boolean,
  searchValue: string,
|};

// See https://github.com/moroshko/react-autosuggest#onSuggestionsFetchRequestedProp
type OnSuggestionsFetchRequestedParams = {|
  value: string,
  reason:
    | 'input-changed'
    | 'input-focused'
    | 'escape-pressed'
    | 'suggestions-revealed'
    | 'suggestion-selected'
|};

// See https://github.com/moroshko/react-autosuggest#inputpropsonchange-required
type OnSearchChangeParams = {|
  newValue: string,
  method:
    | 'down'
    | 'up'
    | 'escape'
    | 'enter'
    | 'click'
    | 'type'
|};

export class AutoSearchInputBase extends React.Component<Props, State> {
  searchInput: React.ElementRef<'input'> | null;

  static defaultProps = {
    debounce: defaultDebounce,
  };

  constructor(props: Props) {
    super(props);
    invariant(props.inputName, 'The inputName property is required');
    invariant(props.onSearch, 'The onSearch property is required');
    invariant(props.onSuggestionSelected,
      'The onSuggestionSelected property is required');

    this.state = {
      autocompleteIsOpen: false,
      searchValue: props.query || '',
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    const { query } = nextProps;

    if (this.props.query !== query) {
      this.setState({ searchValue: query || '' });
    }
  }

  createFiltersFromQuery(query: string) {
    const { location, userAgentInfo } = this.props;
    // Preserve any existing search filters.
    const filtersFromLocation =
      convertQueryParamsToFilters(location.query);
    // Do not preserve page. New searches should always start on page 1.
    delete filtersFromLocation.page;

    return {
      operatingSystem: convertOSToFilterValue(userAgentInfo.os.name),
      ...filtersFromLocation,
      ...{ query },
    };
  }

  dispatchAutocompleteStart = this.props.debounce(({ filters }) => {
    const { dispatch, errorHandler } = this.props;

    dispatch(autocompleteStart({
      errorHandlerId: errorHandler.id,
      filters,
    }));
  }, 200, { trailing: true })

  handleSuggestionsClearRequested = () => {
    this.setState({ autocompleteIsOpen: false });
    this.props.dispatch(autocompleteCancel());
  }

  handleSuggestionsFetchRequested = (
    { value, reason }: OnSuggestionsFetchRequestedParams
  ) => {
    if (!value) {
      log.debug(oneLine`Ignoring suggestions fetch requested because
        value is not supplied: ${value}`);
      return;
    }

    if (value.length > SEARCH_TERM_MAX_LENGTH) {
      log.debug(oneLine`Ignoring suggestions fetch because query
        exceeds max length (${SEARCH_TERM_MAX_LENGTH})`
      );
      return;
    }

    const filters = this.createFiltersFromQuery(value);

    this.setState({ autocompleteIsOpen: true });

    if (reason === 'input-focused') {
      log.debug('Ignoring suggestions fetch on search input focus');
      return;
    }

    this.dispatchAutocompleteStart({ filters });
  }

  getSuggestions(): Array<SuggestionType> {
    if (this.props.loadingSuggestions) {
      // 10 is the maximum number of results returned by the API
      return Array(10).fill({
        iconUrl: getAddonIconUrl(),
        name: this.props.i18n.gettext('Loading'),
        loading: true,
        url: undefined,
      });
    }

    return this.props.suggestions;
  }

  handleSearch = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    if (this.searchInput) {
      // When submitting the form to view all search results, blurring
      // the input will hide the suggestion results menu.
      //
      // TODO: We may be able to blur this without relying on a ref soon:
      // https://github.com/moroshko/react-autosuggest/issues/370
      //
      // The method for obtaining this ref is undocumented but the
      // library author suggests it in this comment:
      // https://github.com/moroshko/react-autosuggest/issues/158#issuecomment-219322960
      this.searchInput.blur();
    }

    const filters = this.createFiltersFromQuery(this.state.searchValue);
    this.props.onSearch(filters);
  }

  handleSearchChange = (
    event: SyntheticEvent<HTMLInputElement>,
    { newValue }: OnSearchChangeParams
  ) => {
    const searchValue = newValue || '';
    if (searchValue.trim().length <= SEARCH_TERM_MAX_LENGTH) {
      this.setState({ searchValue });
    }
  }

  handleSuggestionSelected = (
    e: SyntheticEvent<any>,
    { suggestion }: {| suggestion: SuggestionType |}
  ) => {
    e.preventDefault();

    // TODO: this can probably check props.loadingSuggestions and then
    // the loading attribute can be removed from suggestion objects.
    if (suggestion.loading) {
      log.debug('Ignoring loading suggestion selected');
      return;
    }

    this.setState({ autocompleteIsOpen: false, searchValue: '' });
    this.props.onSuggestionSelected(suggestion);
  }

  renderSuggestion = (suggestion: SuggestionType) => {
    const { i18n, selectSuggestionText } = this.props;
    const { name, iconUrl, loading } = suggestion;

    const arrowAlt =
      selectSuggestionText || i18n.gettext('Go to the add-on page');
    return (
      <SearchSuggestion
        name={name}
        iconUrl={iconUrl}
        loading={loading}
        arrowAlt={arrowAlt}
      />
    );
  }

  render() {
    const {
      errorHandler,
      i18n,
      inputName,
      inputPlaceholder,
    } = this.props;

    const autocompleteIsOpen = this.state.autocompleteIsOpen &&
      // This prevents the input to look like Autosuggest is open when
      // there are no results coming from the API.
      this.getSuggestions().length > 0;

    const inputProps = {
      className: 'AutoSearchInput-query',
      maxLength: SEARCH_TERM_MAX_LENGTH,
      name: inputName,
      onChange: this.handleSearchChange,
      placeholder: inputPlaceholder || i18n.gettext('Find add-ons'),
      type: 'search',
      value: this.state.searchValue,
    };

    const theme = {
      suggestionContainer: 'AutoSearchInput-suggestions',
      suggestionsList: 'AutoSearchInput-suggestions-list',
      suggestion: 'AutoSearchInput-suggestions-item',
      suggestionHighlighted:
        'AutoSearchInput-suggestions-item--highlighted',
    };

    return (
      <div
        className={makeClassName('AutoSearchInput', {
          'AutoSearchInput--autocompleteIsOpen': autocompleteIsOpen,
        })}
      >
        {errorHandler.renderErrorIfPresent()}
        <label
          className="visually-hidden"
          htmlFor={inputName}
        >
          {i18n.gettext('Search')}
        </label>
        <Icon
          className="AutoSearchInput-icon-magnifying-glass"
          name="magnifying-glass"
        />
        <Autosuggest
          focusInputOnSuggestionClick={false}
          getSuggestionValue={(suggestion) => suggestion.name}
          inputProps={inputProps}
          onSuggestionsClearRequested={
            this.handleSuggestionsClearRequested
          }
          onSuggestionsFetchRequested={
            this.handleSuggestionsFetchRequested
          }
          onSuggestionSelected={this.handleSuggestionSelected}
          ref={(autosuggest) => {
            if (autosuggest) {
              this.searchInput = autosuggest.input;
            }
          }}
          renderSuggestion={this.renderSuggestion}
          suggestions={this.getSuggestions()}
          theme={theme}
        />
        <button
          className="AutoSearchInput-submit-button"
          onClick={this.handleSearch}
          type="submit"
        >
          <span className="visually-hidden">
            {i18n.gettext('Search')}
          </span>
          <Icon name="arrow" />
        </button>
      </div>
    );
  }
}

// TODO: port reducers/autocomplete.js to Flow
type AutocompleteState = Object;

const mapStateToProps = (
  state: {| api: ApiStateType, autocomplete: AutocompleteState |}
): $Shape<Props> => {
  return {
    suggestions: state.autocomplete.suggestions,
    loadingSuggestions: state.autocomplete.loading,
    userAgentInfo: state.api.userAgentInfo,
  };
};

export const extractId = (ownProps: Props): string => ownProps.inputName;

export default compose(
  withRouter,
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
  translate(),
)(AutoSearchInputBase);
