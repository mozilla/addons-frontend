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
import { ADDON_TYPE_EXTENSION, OS_LINUX, OS_WINDOWS } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import {
  autocompleteCancel,
  autocompleteStart,
  createInternalSuggestion,
} from 'core/reducers/autocomplete';
import {
  createFakeAutocompleteResult,
  dispatchAutocompleteResults,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
  simulateComponentCallback,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';

describe(__filename, () => {
  const getProps = ({
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) => {
    return {
      // This simulates debounce() without any debouncing.
      debounce: (callback) => (...args) => callback(...args),
      i18n: fakeI18n(),
      inputName: 'query',
      location: fakeRouterLocation(),
      onSearch: sinon.stub(),
      onSuggestionSelected: sinon.stub(),
      selectSuggestionText: 'Go to the extension detail page',
      store,
      ...customProps,
    };
  };

  const render = (customProps) => {
    const props = getProps(customProps);
    return shallowUntilTarget(
      <AutoSearchInput {...props} />,
      AutoSearchInputBase,
    );
  };

  const renderAndMount = (customProps) => {
    const props = getProps(customProps);
    return mount(<AutoSearchInput {...props} />);
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
      const root = render({ query });

      expect(getInputProps(root)).toMatchObject({ value: query });
    });

    it('renders an updated query', () => {
      const root = render();

      const query = 'ad blocker';
      root.setProps({ query });

      expect(getInputProps(root)).toMatchObject({ value: query });
    });

    it('only sets an updated query if it is unique', () => {
      const query = 'ad blocker';
      const root = render({ query });

      const typedQuery = 'panda themes';
      inputSearchQuery(root, typedQuery);

      // Update the component with the same initial query. This should
      // be ignored.
      root.setProps({ query });

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
        location: fakeRouterLocation({ query: { page: 3 } }),
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

    it('preserves existing search filters on the query string', () => {
      const { store } = dispatchClientMetadata();
      const dispatch = sinon.spy(store, 'dispatch');
      const locationQuery = { type: ADDON_TYPE_EXTENSION };
      const root = render({
        store,
        location: fakeRouterLocation({ query: locationQuery }),
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
      const root = render({
        store,
      });

      const query = 'ad blocker';
      fetchSuggestions({ root, query });

      sinon.assert.calledWith(
        dispatch,
        autocompleteStart({
          errorHandlerId: root.instance().props.errorHandler.id,
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
        location: fakeRouterLocation({ query: locationQuery }),
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

      const suggestion = createInternalSuggestion(
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

      const suggestion = createInternalSuggestion(
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

      const suggestion = createInternalSuggestion(externalSuggestion);
      selectSuggestion({ root, suggestion });

      expect(root).not.toHaveClassName('AutoSearchInput--autocompleteIsOpen');
    });

    it('resets the search query when selecting a suggestion', () => {
      const root = render({ query: 'panda themes' });

      const suggestion = createInternalSuggestion(
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
      suggestionData = createInternalSuggestion(createFakeAutocompleteResult()),
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
      const suggestion = createInternalSuggestion(
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
      const name = 'uBlock Origin';
      const suggestionData = createInternalSuggestion(
        createFakeAutocompleteResult({ name }),
      );
      const suggestion = renderSuggestion({ suggestionData });

      expect(suggestion).toHaveProp('name', name);
      expect(suggestion).toHaveProp('iconUrl', suggestionData.iconUrl);
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
      const suggestionData = createInternalSuggestion(
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
      const firstResult = createFakeAutocompleteResult({ name: 'Addon One' });
      const secondResult = createFakeAutocompleteResult({ name: 'Addon Two' });
      const { store } = dispatchAutocompleteResults({
        results: [firstResult, secondResult],
      });

      const root = render({ store });
      const suggestions = getSuggestions(root);

      expect(suggestions[0]).toMatchObject({
        name: firstResult.name,
        addonId: firstResult.id,
      });
      expect(suggestions[1]).toMatchObject({
        name: secondResult.name,
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
