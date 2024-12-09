/* @flow */
/* eslint-disable react/prop-types, react/no-unused-prop-types */
import { oneLine } from 'common-tags';
import makeClassName from 'classnames';
import invariant from 'invariant';
import defaultDebounce from 'lodash.debounce';
import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import SearchSuggestion from 'amo/components/SearchSuggestion';
import { SEARCH_SORT_RANDOM } from 'amo/constants';
import { withFixedErrorHandler } from 'amo/errorHandler';
import { getAddonIconUrl } from 'amo/imageUtils';
import log from 'amo/logger';
import { convertQueryParamsToFilters } from 'amo/searchUtils';
import translate from 'amo/i18n/translate';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'amo/reducers/autocomplete';
import Icon from 'amo/components/Icon';
import type { AppState } from 'amo/store';
import type { SuggestionType } from 'amo/reducers/autocomplete';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterLocationType } from 'amo/types/router';
import type { ErrorHandlerType } from 'amo/types/errorHandler';

import './styles.scss';

export const SEARCH_TERM_MIN_LENGTH = 2;
export const SEARCH_TERM_MAX_LENGTH = 100;

// TODO: create a type for the inverse of paramsToFilter in
// amo/searchUtils and move this there.
export type SearchFilters = Object;

type Props = {|
  inputLabelText?: string,
  // This is the name property of the <input> tag.
  inputName: string,
  inputPlaceholder?: string,
  onSearch?: (SearchFilters) => void,
  onSuggestionSelected: (SuggestionType) => void,
  // This is accessibility text for what selecting a suggestion will do.
  selectSuggestionText: string,
  showInputLabel?: boolean,
|};

type DefaultProps = {|
  debounce: typeof defaultDebounce,
  showInputLabel?: boolean,
|};

type PropsFromState = {|
  suggestions: Array<SuggestionType>,
  loadingSuggestions: boolean,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  location: ReactRouterLocationType,
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

  static defaultProps: DefaultProps = {
    debounce: defaultDebounce,
    showInputLabel: true,
  };

  constructor(props: InternalProps) {
    super(props);

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
      searchValue: this.getSearchValueFromProps(props),
    };
  }

  getSearchValueFromProps({ location, inputName }: InternalProps): string {
    if (!location.query || typeof location.query[inputName] !== 'string') {
      return '';
    }

    return location.query[inputName] || '';
  }

  createFiltersFromQuery(query: string): Object {
    const { location } = this.props;
    // Preserve any existing search filters.
    let filtersFromLocation: { sort?: string } = {};
    if (location) {
      filtersFromLocation = convertQueryParamsToFilters(location.query);
      // Do not preserve page. New searches should always start on page 1.
      delete filtersFromLocation.page;
    }

    // We want to make sure not to pass `sort=random` along with a query, so
    // we remove it here.
    if (
      filtersFromLocation.sort &&
      filtersFromLocation.sort === SEARCH_SORT_RANDOM
    ) {
      delete filtersFromLocation.sort;
    }

    return {
      ...filtersFromLocation,
      query,
    };
  }

  handleSuggestionsClearRequested: () => void = () => {
    this.setState({ autocompleteIsOpen: false });
    this.props.dispatch(autocompleteCancel());
  };

  handleSuggestionsFetchRequested: (OnSuggestionsFetchRequestedParams) => void =
    ({ value }: OnSuggestionsFetchRequestedParams) => {
      invariant(value, 'It should not be possible to have a falsey value');
      invariant(
        value.length <= SEARCH_TERM_MAX_LENGTH,
        `It should not be possible to have a value > ${SEARCH_TERM_MAX_LENGTH}`,
      );

      if (value.length < SEARCH_TERM_MIN_LENGTH) {
        log.debug(oneLine`Ignoring suggestions fetch because query
      does not meet the required length (${SEARCH_TERM_MIN_LENGTH})`);

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
        promoted: null,
        url: undefined,
      });
    }

    return this.props.suggestions;
  }

  handleSearch: HTMLElementEventHandler = (event: ElementEvent) => {
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

    const { onSearch } = this.props;

    if (onSearch) {
      const filters = this.createFiltersFromQuery(
        this.state.searchValue.trim(),
      );
      onSearch(filters);
    }
  };

  handleSearchChange: (event: ElementEvent, OnSearchChangeParams) => void = (
    event: ElementEvent,
    { newValue }: OnSearchChangeParams,
  ) => {
    const searchValue = newValue || '';
    if (searchValue.trim().length <= SEARCH_TERM_MAX_LENGTH) {
      this.setState({ searchValue });
    }
  };

  handleSuggestionSelected: (
    event: ElementEvent,
    {| suggestion: SuggestionType |},
  ) => void = (
    event: ElementEvent,
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

  renderSuggestion: (suggestion: SuggestionType) => React.Node = (
    suggestion: SuggestionType,
  ) => {
    const { loadingSuggestions, selectSuggestionText } = this.props;

    return (
      <SearchSuggestion
        arrowAlt={selectSuggestionText}
        loading={loadingSuggestions}
        suggestion={suggestion}
      />
    );
  };

  render(): React.Node {
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
      id: `AutoSearchInput-${inputName}`,
      maxLength: SEARCH_TERM_MAX_LENGTH,
      minLength: SEARCH_TERM_MIN_LENGTH,
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
          htmlFor={inputProps.id}
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

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    suggestions: state.autocomplete.suggestions,
    loadingSuggestions: state.autocomplete.loading,
  };
};

export const extractId = (ownProps: Props): string => ownProps.inputName;

const AutoSearchInput: React.ComponentType<Props> = compose(
  withRouter,
  withFixedErrorHandler({ fileName: __filename, extractId }),
  connect(mapStateToProps),
  translate(),
)(AutoSearchInputBase);

export default AutoSearchInput;
