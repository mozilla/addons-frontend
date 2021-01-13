import { mount, shallow } from 'enzyme';
import * as React from 'react';
import Autosuggest from 'react-autosuggest';

import AutoSearchInput, {
  extractId,
  AutoSearchInputBase,
  SEARCH_TERM_MIN_LENGTH,
  SEARCH_TERM_MAX_LENGTH,
} from 'amo/components/AutoSearchInput';
import SearchSuggestion from 'amo/components/SearchSuggestion';
import {
  ADDON_TYPE_EXTENSION,
  OS_LINUX,
  OS_WINDOWS,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RANDOM,
} from 'amo/constants';
import { ErrorHandler } from 'amo/errorHandler';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'amo/reducers/autocomplete';
import {
  createContextWithFakeRouter,
  createFakeAutocompleteResult,
  createFakeDebounce,
  createFakeEvent,
  createFakeLocation,
  createInternalSuggestionWithLang,
  createStubErrorHandler,
  dispatchAutocompleteResults,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
  simulateComponentCallback,
} from 'tests/unit/helpers';
import ErrorList from 'amo/components/ErrorList';

describe(__filename, () => {
  const getProps = ({
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    return {
      debounce: createFakeDebounce(),
      i18n: fakeI18n(),
      inputName: 'query',
      location: createFakeLocation(),
      onSearch: sinon.stub(),
      onSuggestionSelected: sinon.stub(),
      selectSuggestionText: 'Go to the extension detail page',
      store,
      ...customProps,
    };
  };

  const render = (customProps) => {
    const { location, ...props } = getProps(customProps);

    return shallowUntilTarget(
      <AutoSearchInput {...props} />,
      AutoSearchInputBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  const renderAndMount = (customProps) => {
    const props = getProps(customProps);

    return mount(<AutoSearchInput {...props} />, createContextWithFakeRouter());
  };

  const simulateAutosuggestCallback = (props = {}) => {
    return simulateComponentCallback({
      Component: Autosuggest,
      ...props,
    });
  };

  const fetchSuggestions = ({ root, query, reason = 'input-changed' }) => {
    const onSuggestionsFetchRequested = simulateAutosuggestCallback({
      root,
      propName: 'onSuggestionsFetchRequested',
    });
    onSuggestionsFetchRequested({ value: query, reason });
  };

  describe('search input', () => {
    const inputSearchQuery = (root, searchQuery) => {
      const autosuggest = root.find(Autosuggest);
      expect(autosuggest).toHaveProp('inputProps');

      const { onChange } = autosuggest.prop('inputProps');
      expect(typeof onChange).toEqual('function');

      onChange(createFakeEvent(), {
        newValue: searchQuery,
        method: 'type',
      });

      // Since the component might call setState() and that would happen
      // outside of a standard React lifestyle hook, we have to re-render.
      root.update();
    };

    const getInputProps = (root) => {
      const autosuggest = root.find(Autosuggest);
      expect(autosuggest).toHaveProp('inputProps');
      return autosuggest.prop('inputProps');
    };

    it('renders a search input', () => {
      const root = render();

      expect(root.find('.AutoSearchInput')).toHaveLength(1);
    });

    it('renders an initial query', () => {
      const query = 'ad blocker';
      const location = createFakeLocation({ query: { query } });

      const root = render({ location });

      expect(getInputProps(root)).toMatchObject({ value: query });
    });

    it('sets the search value to an empty string when there is no `location.query`', () => {
      const location = createFakeLocation({ query: null });

      const root = render({ location });

      expect(root).toHaveState('searchValue', '');
    });

    it('does not update the query on location changes', () => {
      const query = 'ad blocker';
      const location = createFakeLocation({ query: { query } });

      const root = render({ location });

      const typedQuery = 'panda themes';
      inputSearchQuery(root, typedQuery);

      // Update the component with the same initial query. This should be
      // ignored.
      root.setProps({ location });

      expect(getInputProps(root)).toMatchObject({ value: typedQuery });
    });

    it('handles typing text into the input', () => {
      const root = render();

      const typedQuery = 'ad blocker';
      inputSearchQuery(root, typedQuery);

      expect(getInputProps(root)).toMatchObject({ value: typedQuery });
    });

    it('ignores really long search queries', () => {
      const root = render();

      const typedQuery = 't'.repeat(SEARCH_TERM_MAX_LENGTH + 1);
      inputSearchQuery(root, typedQuery);

      // The query was too long. It should be ignored.
      expect(getInputProps(root)).toMatchObject({ value: '' });
    });

    it('lets you configure the input placeholder', () => {
      const inputPlaceholder = 'Type an add-on name';
      const root = render({ inputPlaceholder });

      expect(getInputProps(root)).toMatchObject({
        placeholder: inputPlaceholder,
      });
    });

    it('lets you configure the input name', () => {
      const inputName = 'search-input';
      const root = render({ inputName });

      expect(getInputProps(root)).toMatchObject({ name: inputName });
    });

    it('handles submitting a search', () => {
      const onSearch = sinon.stub();
      const root = render({ onSearch });

      const query = 'panda themes';
      inputSearchQuery(root, query);

      root
        .find('.AutoSearchInput-submit-button')
        .simulate('click', createFakeEvent());

      sinon.assert.calledWith(onSearch, {
        query,
        operatingSystem: OS_WINDOWS,
      });
    });

    it('trims spaces from the input', () => {
      const onSearch = sinon.stub();
      const root = render({ onSearch });

      inputSearchQuery(root, '     ');

      root
        .find('.AutoSearchInput-submit-button')
        .simulate('click', createFakeEvent());

      sinon.assert.calledWith(onSearch, {
        query: '',
        operatingSystem: OS_WINDOWS,
      });

      onSearch.resetHistory();
      inputSearchQuery(root, '  abc  ');

      root
        .find('.AutoSearchInput-submit-button')
        .simulate('click', createFakeEvent());

      sinon.assert.calledWith(onSearch, {
        query: 'abc',
        operatingSystem: OS_WINDOWS,
      });
    });

    it('blurs the input when submitting a search', () => {
      const root = renderAndMount();
      const blurSpy = sinon.spy(
        root.find(Autosuggest).instance().input,
        'blur',
      );

      const query = 'panda themes';
      inputSearchQuery(root, query);

      root
        .find('.AutoSearchInput-submit-button')
        .simulate('click', createFakeEvent());

      sinon.assert.called(blurSpy);
    });

    it('shows the input label by default', () => {
      const root = render();

      expect(root.find('.AutoSearchInput-label')).not.toHaveClassName(
        'visually-hidden',
      );
    });

    it('lets you hide the input label', () => {
      const root = render({ showInputLabel: false });

      expect(root.find('.AutoSearchInput-label')).toHaveClassName(
        'visually-hidden',
      );
    });

    it('lets you configure the input label text', () => {
      const inputLabelText = 'Search for add-ons';
      const root = render({ inputLabelText });

      expect(root.find('.AutoSearchInput-label').text()).toContain(
        inputLabelText,
      );
    });
  });

  describe('fetching search suggestions', () => {
    it('fetches search suggestions', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const root = render({ store });

      const query = 'ad blocker';
      fetchSuggestions({ root, query });

      sinon.assert.calledWith(
        dispatchSpy,
        autocompleteStart({
          errorHandlerId: root.instance().props.errorHandler.id,
          filters: { query, operatingSystem: OS_WINDOWS },
        }),
      );
    });

    it('fetches suggestions without a page', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const root = render({
        store,
        location: createFakeLocation({ query: { page: 3 } }),
      });

      fetchSuggestions({ root, query: 'ad blocker' });

      sinon.assert.calledWith(
        dispatchSpy,
        autocompleteStart({
          errorHandlerId: root.instance().props.errorHandler.id,
          filters: sinon.match(
            // Make sure the search is executed without a page parameter.
            (filters) => typeof filters.page === 'undefined',
          ),
        }),
      );
    });

    it('does not pass a `random` sort filter', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const root = render({
        location: createFakeLocation({ query: { sort: SEARCH_SORT_RANDOM } }),
        store,
      });

      fetchSuggestions({ root, query: 'ad blocker' });

      sinon.assert.calledWith(
        dispatchSpy,
        autocompleteStart({
          errorHandlerId: root.instance().props.errorHandler.id,
          filters: sinon.match(
            // Make sure the search is executed without a sort parameter.
            (filters) => typeof filters.sort === 'undefined',
          ),
        }),
      );
    });

    it('does pass a sort filter that is not `random`', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const sort = SEARCH_SORT_POPULAR;
      const root = render({
        location: createFakeLocation({ query: { sort } }),
        store,
      });

      fetchSuggestions({ root, query: 'ad blocker' });

      sinon.assert.calledWith(
        dispatchSpy,
        autocompleteStart({
          errorHandlerId: root.instance().props.errorHandler.id,
          filters: sinon.match({ sort }),
        }),
      );
    });

    it('preserves existing search filters on the query string', () => {
      const { store } = dispatchClientMetadata();
      const dispatch = sinon.spy(store, 'dispatch');
      const locationQuery = { type: ADDON_TYPE_EXTENSION };
      const root = render({
        store,
        location: createFakeLocation({ query: locationQuery }),
      });

      const query = 'ad blocker';
      fetchSuggestions({ root, query });

      sinon.assert.calledWith(
        dispatch,
        autocompleteStart({
          errorHandlerId: root.instance().props.errorHandler.id,
          filters: {
            addonType: ADDON_TYPE_EXTENSION,
            operatingSystem: OS_WINDOWS,
            query,
          },
        }),
      );
    });

    it('can be used without a location', () => {
      const { store } = dispatchClientMetadata();
      const dispatch = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const root = render({
        errorHandler,
        store,
      });

      const query = 'ad blocker';
      fetchSuggestions({ root, query });

      sinon.assert.calledWith(
        dispatch,
        autocompleteStart({
          errorHandlerId: errorHandler.id,
          filters: {
            operatingSystem: OS_WINDOWS,
            query,
          },
        }),
      );
    });

    it('lets you override the default operating system', () => {
      const { store } = dispatchClientMetadata();
      const dispatch = sinon.spy(store, 'dispatch');
      const locationQuery = { platform: OS_LINUX };
      const root = render({
        store,
        location: createFakeLocation({ query: locationQuery }),
      });

      const query = 'ad blocker';
      fetchSuggestions({ root, query });

      sinon.assert.calledWith(
        dispatch,
        autocompleteStart({
          errorHandlerId: root.instance().props.errorHandler.id,
          filters: {
            operatingSystem: OS_LINUX,
            query,
          },
        }),
      );
    });

    it('does not fetch suggestions with an empty value', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const root = render({ store });

      fetchSuggestions({ root, query: '' });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not fetch suggestions for a really short value', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const root = render({ store });

      fetchSuggestions({
        root,
        query: 't'.repeat(SEARCH_TERM_MIN_LENGTH - 1),
      });

      sinon.assert.calledWith(dispatchSpy, autocompleteCancel());
      sinon.assert.callCount(dispatchSpy, 1);
    });

    it('does not fetch suggestions for a really long value', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const root = render({ store });

      fetchSuggestions({
        root,
        query: 't'.repeat(SEARCH_TERM_MAX_LENGTH + 1),
      });

      sinon.assert.calledWith(dispatchSpy, autocompleteCancel());
      sinon.assert.callCount(dispatchSpy, 1);
    });

    it('keeps the search results menu open while searching', () => {
      const { store } = dispatchAutocompleteResults({
        results: [createFakeAutocompleteResult()],
      });

      const root = render({ store });

      fetchSuggestions({ root, query: 'panda themes' });

      expect(root).toHaveClassName('AutoSearchInput--autocompleteIsOpen');
    });

    it('keeps the search results menu open when focused', () => {
      const { store } = dispatchAutocompleteResults({
        results: [createFakeAutocompleteResult()],
      });

      const root = render({ store });

      fetchSuggestions({
        root,
        query: 'a theme',
        reason: 'input-focused',
      });

      expect(root).toHaveClassName('AutoSearchInput--autocompleteIsOpen');
    });
  });

  describe('clearing search suggestions', () => {
    const clearSuggestions = (root) => {
      const onSuggestionsClearRequested = simulateAutosuggestCallback({
        root,
        propName: 'onSuggestionsClearRequested',
      });
      onSuggestionsClearRequested();
    };

    it('closes suggestion menu when cleared', () => {
      const { store } = dispatchAutocompleteResults({
        results: [createFakeAutocompleteResult()],
      });

      const root = render({ store });
      fetchSuggestions({ root, query: 'panda themes' });

      clearSuggestions(root);

      expect(root).not.toHaveClassName('AutoSearchInput--autocompleteIsOpen');
    });

    it('cancels pending requests on autosuggest cancel', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.stub(store, 'dispatch');
      const root = render({ store });

      clearSuggestions(root);

      sinon.assert.calledWith(dispatchSpy, autocompleteCancel());
    });
  });

  describe('selecting search suggestions', () => {
    const selectSuggestion = ({ root, suggestion }) => {
      const onSuggestionSelected = simulateAutosuggestCallback({
        root,
        propName: 'onSuggestionSelected',
      });
      onSuggestionSelected(createFakeEvent(), { suggestion });
    };

    it('executes a callback when selecting a suggestion', () => {
      const onSuggestionSelected = sinon.stub();
      const root = render({ onSuggestionSelected });

      const suggestion = createInternalSuggestionWithLang(
        createFakeAutocompleteResult({ name: 'uBlock Origin' }),
      );

      selectSuggestion({ root, suggestion });

      sinon.assert.calledWith(onSuggestionSelected, suggestion);
    });

    it('does not execute callback when selecting a placeholder', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(
        autocompleteStart({
          errorHandlerId: 'some-error-handler',
          filters: { query: 'ad blockers' },
        }),
      );

      const onSuggestionSelected = sinon.stub();
      const root = render({ store, onSuggestionSelected });

      const suggestion = createInternalSuggestionWithLang(
        createFakeAutocompleteResult({ name: 'uBlock Origin' }),
      );

      selectSuggestion({ root, suggestion });

      sinon.assert.notCalled(onSuggestionSelected);
    });

    it('closes suggestion menu when selecting a suggestion', () => {
      const externalSuggestion = createFakeAutocompleteResult();
      const { store } = dispatchAutocompleteResults({
        results: [externalSuggestion],
      });

      const root = render({ store });
      fetchSuggestions({ root, query: 'panda themes' });

      const suggestion = createInternalSuggestionWithLang(externalSuggestion);
      selectSuggestion({ root, suggestion });

      expect(root).not.toHaveClassName('AutoSearchInput--autocompleteIsOpen');
    });

    it('resets the search query when selecting a suggestion', () => {
      const root = render({ query: 'panda themes' });

      const suggestion = createInternalSuggestionWithLang(
        createFakeAutocompleteResult(),
      );
      selectSuggestion({ root, suggestion });

      const autosuggest = root.find(Autosuggest);
      expect(autosuggest.prop('inputProps')).toMatchObject({
        // Make sure the query was reset.
        value: '',
      });
    });
  });

  describe('suggestion result', () => {
    const renderSuggestion = ({
      root = render(),
      suggestionData = createInternalSuggestionWithLang(
        createFakeAutocompleteResult(),
      ),
    } = {}) => {
      const _renderSuggestion = simulateAutosuggestCallback({
        root,
        propName: 'renderSuggestion',
      });
      const suggestion = _renderSuggestion(suggestionData);
      return shallow(<div>{suggestion}</div>).find(SearchSuggestion);
    };

    it('converts a suggestion result into a value', () => {
      const name = 'uBlock Origin';
      const suggestion = createInternalSuggestionWithLang(
        createFakeAutocompleteResult({ name }),
      );

      const root = render();
      const getSuggestionValue = simulateAutosuggestCallback({
        root,
        propName: 'getSuggestionValue',
      });
      const value = getSuggestionValue(suggestion);

      expect(value).toEqual(name);
    });

    it('renders a suggestion', () => {
      const suggestionData = createInternalSuggestionWithLang(
        createFakeAutocompleteResult(),
      );
      const suggestion = renderSuggestion({ suggestionData });

      expect(suggestion).toHaveProp('suggestion', suggestionData);
    });

    it('renders search suggestion in a loading state', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(
        autocompleteStart({
          errorHandlerId: 'some-error-handler',
          filters: { query: 'ad blockers' },
        }),
      );

      const root = render({ store });
      const suggestionData = createInternalSuggestionWithLang(
        createFakeAutocompleteResult(),
      );
      const suggestion = renderSuggestion({ root, suggestionData });

      expect(suggestion).toHaveProp('loading', true);
    });

    it('renders custom arrow alt text', () => {
      const selectSuggestionText = 'Visit extension detail page';
      const root = render({ selectSuggestionText });
      const suggestion = renderSuggestion({ root });

      expect(suggestion).toHaveProp('arrowAlt', selectSuggestionText);
    });
  });

  describe('getting suggestion data', () => {
    const getSuggestions = (root) => {
      const autosuggest = root.find(Autosuggest);
      expect(autosuggest).toHaveProp('suggestions');
      return autosuggest.prop('suggestions');
    };

    it('returns suggestion results', () => {
      const firstName = 'Addon One';
      const secondName = 'Addon Two';
      const firstResult = createFakeAutocompleteResult({ name: firstName });
      const secondResult = createFakeAutocompleteResult({ name: secondName });
      const { store } = dispatchAutocompleteResults({
        results: [firstResult, secondResult],
      });

      const root = render({ store });
      const suggestions = getSuggestions(root);

      expect(suggestions[0]).toMatchObject({
        name: firstName,
        addonId: firstResult.id,
      });
      expect(suggestions[1]).toMatchObject({
        name: secondName,
        addonId: secondResult.id,
      });

      expect(suggestions).toEqual(root.find(Autosuggest).prop('suggestions'));
    });

    it('configures search suggestions in a loading state', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(
        autocompleteStart({
          errorHandlerId: 'some-error-handler',
          filters: { query: 'ad blockers' },
        }),
      );

      const root = render({ store });
      const suggestions = getSuggestions(root);

      // Exactly 10 placeholders are returned.
      expect(suggestions).toHaveLength(10);
      expect(suggestions[0]).toMatchObject({ name: 'Loading' });
    });
  });

  it('sets an `id` to the input and a `htmlFor` attribute to the `label`', () => {
    const inputName = 'my-custom-input';
    const root = render({ inputName });

    const expectedId = `AutoSearchInput-${inputName}`;
    expect(root.find(Autosuggest).prop('inputProps')).toHaveProperty(
      'id',
      expectedId,
    );
    expect(root.find('label')).toHaveProp('htmlFor', expectedId);
  });

  describe('error handling', () => {
    it('creates an error handler ID with inputName', () => {
      const inputName = 'my-custom-input';
      expect(extractId(getProps({ inputName }))).toEqual(inputName);
    });

    it('renders errors', () => {
      const { store } = dispatchClientMetadata();
      const errorHandler = new ErrorHandler({
        id: 'some-id',
        dispatch: store.dispatch,
      });
      errorHandler.handle(new Error('unexpected error'));

      const root = render({ errorHandler, store });

      expect(root.find(ErrorList)).toHaveLength(1);
    });
  });
});
