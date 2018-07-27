/* @flow */
/* eslint-disable react/prop-types, react/sort-comp, react/no-unused-prop-types */
import { oneLine } from 'common-tags';
import makeClassName from 'classnames';
import invariant from 'invariant';
import defaultDebounce from 'lodash.debounce';
import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import { connect } from 'react-redux';
import { compose } from 'redux';

import SearchSuggestion from 'amo/components/SearchSuggestion';
import { withFixedErrorHandler } from 'core/errorHandler';
import { getAddonIconUrl } from 'core/imageUtils';
import log from 'core/logger';
import {
  convertOSToFilterValue,
  convertQueryParamsToFilters,
} from 'core/searchUtils';
import translate from 'core/i18n/translate';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import Icon from 'ui/components/Icon';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocationType } from 'core/types/router';
import type { ErrorHandlerType } from 'core/errorHandler';

import './styles.scss';

export const SEARCH_TERM_MIN_LENGTH = 3;
export const SEARCH_TERM_MAX_LENGTH = 100;

// TODO: port reducers/autocomplete.js to Flow and move this there.
export type SuggestionType = {|
  addonId: number,
  iconUrl: string,
  name: string,
  type: string,
  url: string,
|};

// TODO: create a type for the inverse of paramsToFilter in
// core/searchUtils and move this there.
export type SearchFilters = Object;

type Props = {|
  inputLabelText?: string,
  // This is the name property of the <input> tag.
  inputName: string,
  inputPlaceholder?: string,
  location?: ReactRouterLocationType,
  onSearch: (SearchFilters) => void,
  onSuggestionSelected: (SuggestionType) => void,
  query?: string,
  // This is accessibility text for what selecting a suggestion will do.
  selectSuggestionText: string,
  showInputLabel?: boolean,
|};

type MappedProps = {|
  suggestions: Array<SuggestionType>,
  loadingSuggestions: boolean,
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...MappedProps,
  debounce: typeof defaultDebounce,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
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
    | 'suggestion-selected',
|};

// See https://github.com/moroshko/react-autosuggest#inputpropsonchange-required
type OnSearchChangeParams = {|
  newValue: string,
  method: 'down' | 'up' | 'escape' | 'enter' | 'click' | 'type',
|};

export class AutoSearchInputBase extends React.Component<InternalProps, State> {
  dispatchAutocompleteStart: (filters: Object) => void;
  searchInput: React.ElementRef<'input'> | null;

  static defaultProps = {
    debounce: defaultDebounce,
    showInputLabel: true,
  };

  constructor(props: InternalProps) {
    super(props);
    invariant(props.inputName, 'The inputName property is required');
    invariant(props.onSearch, 'The onSearch property is required');
    invariant(
      props.onSuggestionSelected,
      'The onSuggestionSelected property is required',
    );
    invariant(
      props.selectSuggestionText,
      'The selectSuggestionText property is required',
    );

    this.dispatchAutocompleteStart = this.props.debounce(
      ({ filters }) => {
        const { dispatch, errorHandler } = this.props;

        dispatch(
          autocompleteStart({
            errorHandlerId: errorHandler.id,
            filters,
          }),
        );
      },
      200,
      { trailing: true },
    );

    this.state = {
      autocompleteIsOpen: false,
      searchValue: props.query || '',
    };
  }

  componentWillReceiveProps(nextProps: InternalProps) {
    const { query } = nextProps;

    if (this.props.query !== query) {
      this.setState({ searchValue: query || '' });
    }
  }

  createFiltersFromQuery(query: string) {
    const { location, userAgentInfo } = this.props;
    // Preserve any existing search filters.
    let filtersFromLocation = {};
    if (location) {
      filtersFromLocation = convertQueryParamsToFilters(location.query);
      // Do not preserve page. New searches should always start on page 1.
      delete filtersFromLocation.page;
    }

    return {
      operatingSystem: convertOSToFilterValue(userAgentInfo.os.name),
      ...filtersFromLocation,
      query,
    };
  }

  handleSuggestionsClearRequested = () => {
    this.setState({ autocompleteIsOpen: false });
    this.props.dispatch(autocompleteCancel());
  };

  handleSuggestionsFetchRequested = ({
    value,
  }: OnSuggestionsFetchRequestedParams) => {
    if (!value) {
      log.debug(oneLine`Ignoring suggestions fetch requested because
        value is not supplied: ${value}`);
      return;
    }

    if (value.length < SEARCH_TERM_MIN_LENGTH) {
      log.debug(oneLine`Ignoring suggestions fetch because query
      does not meet the required length (${SEARCH_TERM_MIN_LENGTH})`);

      this.props.dispatch(autocompleteCancel());
      return;
    }

    if (value.length > SEARCH_TERM_MAX_LENGTH) {
      log.debug(oneLine`Ignoring suggestions fetch because query
        exceeds max length (${SEARCH_TERM_MAX_LENGTH})`);

      this.props.dispatch(autocompleteCancel());
      return;
    }

    const filters = this.createFiltersFromQuery(value);

    this.setState({ autocompleteIsOpen: true });

    this.dispatchAutocompleteStart({ filters });
  };

  getSuggestions(): Array<SuggestionType> {
    if (this.props.loadingSuggestions) {
      // Return 10 pseudo suggestion objects while loading.
      // 10 is the maximum number of results returned by the API.
      return Array(10).fill({
        addonId: undefined,
        iconUrl: getAddonIconUrl(),
        name: this.props.i18n.gettext('Loading'),
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
  };

  handleSearchChange = (
    event: SyntheticEvent<HTMLInputElement>,
    { newValue }: OnSearchChangeParams,
  ) => {
    const searchValue = newValue || '';
    if (searchValue.trim().length <= SEARCH_TERM_MAX_LENGTH) {
      this.setState({ searchValue });
    }
  };

  handleSuggestionSelected = (
    event: SyntheticEvent<any>,
    { suggestion }: {| suggestion: SuggestionType |},
  ) => {
    event.preventDefault();

    if (this.props.loadingSuggestions) {
      log.debug('Ignoring a click on the suggestion while loading');
      return;
    }

    this.setState({ autocompleteIsOpen: false, searchValue: '' });
    this.props.onSuggestionSelected(suggestion);
  };

  renderSuggestion = (suggestion: SuggestionType) => {
    const { loadingSuggestions, selectSuggestionText } = this.props;
    const { iconUrl, name, type } = suggestion;

    return (
      <SearchSuggestion
        arrowAlt={selectSuggestionText}
        iconUrl={iconUrl}
        loading={loadingSuggestions}
        name={name}
        type={type}
      />
    );
  };

  render() {
    const {
      errorHandler,
      i18n,
      inputLabelText,
      inputName,
      inputPlaceholder,
      showInputLabel,
    } = this.props;

    const autocompleteIsOpen =
      this.state.autocompleteIsOpen &&
      // This prevents the input to look like Autosuggest is open when
      // there are no results coming from the API.
      this.getSuggestions().length > 0;

    const inputProps = {
      className: 'AutoSearchInput-query',
      minLength: SEARCH_TERM_MIN_LENGTH,
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
      suggestionHighlighted: 'AutoSearchInput-suggestions-item--highlighted',
    };

    return (
      <div
        className={makeClassName('AutoSearchInput', {
          'AutoSearchInput--autocompleteIsOpen': autocompleteIsOpen,
        })}
      >
        {errorHandler.renderErrorIfPresent()}
        <label
          className={makeClassName('AutoSearchInput-label', {
            'visually-hidden': !showInputLabel,
          })}
          htmlFor={inputName}
        >
          {inputLabelText || i18n.gettext('Search')}
        </label>
        <div className="AutoSearchInput-search-box">
          <Icon
            className="AutoSearchInput-icon-magnifying-glass"
            name="magnifying-glass"
          />
          <Autosuggest
            focusInputOnSuggestionClick={false}
            getSuggestionValue={(suggestion) => suggestion.name}
            inputProps={inputProps}
            onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
            onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
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
            <span className="visually-hidden">{i18n.gettext('Search')}</span>
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState): MappedProps => {
  return {
    suggestions: state.autocomplete.suggestions,
    loadingSuggestions: state.autocomplete.loading,
    userAgentInfo: state.api.userAgentInfo,
  };
};

export const extractId = (ownProps: Props): string => ownProps.inputName;

const AutoSearchInput: React.ComponentType<Props> = compose(
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
  translate(),
)(AutoSearchInputBase);

export default AutoSearchInput;
