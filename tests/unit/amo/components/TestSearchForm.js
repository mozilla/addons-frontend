import { mount } from 'enzyme';
import React from 'react';

import SearchForm, {
  SearchFormBase,
  mapStateToProps,
  SEARCH_TERM_MAX_LENGTH,
} from 'amo/components/SearchForm';
import Suggestion from 'amo/components/SearchSuggestion';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  OS_LINUX,
  OS_WINDOWS,
} from 'core/constants';
import LoadingText from 'ui/components/LoadingText';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import {
  createFakeAutocompleteResult,
  dispatchAutocompleteResults,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  fakeI18n,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let errorHandler;
  let fakeRouter;

  const getProps = (customProps = {}) => {
    return {
      debounce: (callback) => (...args) => callback(...args),
      errorHandler,
      i18n: fakeI18n(),
      pathname: '/search/',
      query: 'foo',
      router: fakeRouter,
      store: dispatchSignInActions().store,
      ...customProps,
    };
  };

  function mountComponent(customProps = {}) {
    const props = getProps(customProps);
    return mount(<SearchForm {...props} />);
  }

  // We use `mount` and the base version of this component for these tests
  // because we need to check the state of the component and the only way
  // to do that is to mount it directly without HOC.
  function mountBaseComponent({ locationQuery, ...customProps } = {}) {
    const props = getProps({
      // When mounting the base component, we have to define `location`
      // directly. When mounting the actual component, withRouter() will
      // pass `location` from `router.location`.
      location: { query: { ...locationQuery } },
      ...customProps,
    });
    return mount(
      <SearchFormBase
        dispatch={sinon.stub()}
        {...mapStateToProps(props.store.getState())}
        {...props}
      />
    );
  }

  const createFakeChangeEvent = (value = '') => {
    return createFakeEvent({
      target: { value },
    });
  };

  describe('render/UI', () => {
    beforeEach(() => {
      errorHandler = createStubErrorHandler();
      // The `withRouter()` HOC passes `location` from `router.location`
      // to the component. In other words, `location` cannot be set directly.
      fakeRouter = {
        location: { query: {} },
        push: sinon.spy(),
      };
    });

    it('renders a form', () => {
      const wrapper = mountComponent();

      expect(wrapper.find('.SearchForm')).toHaveLength(1);
    });

    it('renders a search input with Explore placeholder', () => {
      const wrapper = mountComponent();
      const input = wrapper.find('input');

      expect(input).toHaveProp('placeholder', 'Find add-ons');
      expect(input).toHaveProp('type', 'search');
    });

    it('renders the query', () => {
      const wrapper = mountComponent({ query: 'foo' });

      expect(wrapper.find('.SearchForm-query').prop('value')).toEqual('foo');
    });

    it('changes the URL on submit', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(fakeRouter.push);
      wrapper.find('.SearchForm-query').simulate(
        'change', createFakeChangeEvent('adblock'));
      wrapper.find('form').simulate('submit');
      sinon.assert.called(fakeRouter.push);
    });

    it('blurs the form on submit', () => {
      const wrapper = mountComponent();
      const blurSpy = sinon.spy(
        wrapper.find(SearchFormBase).instance().autosuggest.input, 'blur');

      sinon.assert.notCalled(blurSpy);
      wrapper.find('input').simulate('change', createFakeChangeEvent('something'));
      wrapper.find('form').simulate('submit');
      sinon.assert.called(blurSpy);
    });

    it('does nothing on non-Enter keydowns', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(fakeRouter.push);
      wrapper.find('input').simulate('change', createFakeChangeEvent('adblock'));
      wrapper.find('input').simulate('keydown', { key: 'A', shiftKey: true });
      sinon.assert.notCalled(fakeRouter.push);
    });

    it('updates the location on form submit', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(fakeRouter.push);
      wrapper.find('input').simulate('change', createFakeChangeEvent('adblock'));
      wrapper.find('button').simulate('click');
      sinon.assert.called(fakeRouter.push);
    });

    it('does not set type when it is not defined', () => {
      const { store } = dispatchSignInActions({
        clientApp: CLIENT_APP_ANDROID,
        lang: 'fr',
      });
      const wrapper = mountComponent({ store });

      sinon.assert.notCalled(fakeRouter.push);
      wrapper.find('input').simulate('change', createFakeChangeEvent('searching'));
      wrapper.find('button').simulate('click');
      sinon.assert.calledWith(fakeRouter.push, {
        pathname: '/fr/android/search/',
        query: { platform: OS_WINDOWS, q: 'searching' },
      });
    });

    it('encodes the value of the search text', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(fakeRouter.push);
      wrapper.find('input').simulate('change', createFakeChangeEvent('& 26 %'));
      wrapper.find('button').simulate('click');
      sinon.assert.calledWith(fakeRouter.push, {
        pathname: '/en-US/android/search/',
        query: { platform: OS_WINDOWS, q: '& 26 %' },
      });
    });

    it('updates the state when props update', () => {
      // We can't access the state of components composed with higher order
      // components (HOCs) so we need to mount `SearchFormBase` for the this
      // test.
      const { store } = dispatchSignInActions({
        clientApp: CLIENT_APP_ANDROID,
        lang: 'fr',
      });
      const wrapper = mountBaseComponent({ store });
      expect(wrapper.state('searchValue')).toEqual('foo');

      wrapper.setProps({ query: 'bar' });
      expect(wrapper.state('searchValue')).toEqual('bar');
    });

    it('updates the state when user is typing', () => {
      const wrapper = mountBaseComponent({ query: '' });
      expect(wrapper.state('searchValue')).toEqual('');

      wrapper.find('input').simulate('change', createFakeChangeEvent('foo'));
      expect(wrapper.state('searchValue')).toEqual('foo');

      wrapper.find('input').simulate('change', createFakeChangeEvent(undefined));
      expect(wrapper.state('searchValue')).toEqual('');

      // Tests for allowing only 100 characters as input
      wrapper.find('input').simulate('change', createFakeChangeEvent('t'.repeat(SEARCH_TERM_MAX_LENGTH + 1)));
      expect(wrapper.state('searchValue')).toEqual('');

      wrapper.find('input').simulate('change', createFakeChangeEvent('t'.repeat(SEARCH_TERM_MAX_LENGTH)));
      expect(wrapper.state('searchValue')).toEqual('t'.repeat(SEARCH_TERM_MAX_LENGTH));

      wrapper.find('input').simulate('change', createFakeChangeEvent());
      expect(wrapper.state('searchValue')).toEqual('');
    });

    it('fetches suggestions on focus', () => {
      const { store } = dispatchSignInActions();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const wrapper = mountComponent({ query: 'foo', store });
      // Expect no call to to `handleSuggestionsFetchRequested()` until
      // the input has focus, even if there is already a `searchValue`.
      sinon.assert.notCalled(dispatchSpy);
      // This is needed to trigger `handleSuggestionsFetchRequested()`.
      wrapper.find('input').simulate('focus');

      sinon.assert.callCount(dispatchSpy, 1);
      sinon.assert.calledWith(dispatchSpy, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: {
          query: 'foo',
          operatingSystem: OS_WINDOWS,
        },
      }));
    });

    it('does not fetch suggestions twice on focus when search has not changed', () => {
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });
      const { autocomplete: autocompleteState } = store.getState();

      const dispatch = sinon.spy();
      const wrapper = mountBaseComponent({
        dispatch,
        suggestions: autocompleteState.suggestions,
      });

      sinon.assert.notCalled(dispatch);

      // User types 'a' in the search input.
      wrapper.find('input').simulate('change', createFakeChangeEvent('a'));

      // User clicks somewhere else on the UI, triggering the
      // AUTOCOMPLETE_CANCELLED action.
      store.dispatch(autocompleteCancel());
      wrapper.setProps(mapStateToProps(store.getState()));

      // User focuses the search input.
      wrapper.find('input').simulate('focus');

      expect(wrapper.find(Suggestion)).toHaveLength(
        autocompleteState.suggestions.length
      );

      sinon.assert.callCount(dispatch, 1);
      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { operatingSystem: OS_WINDOWS, query: 'a' },
      }));
    });

    it('does not fetch suggestions twice on focus when query is present but search has not changed', () => {
      // This test case reproduces what would happen if user opens
      // `http://localhost:3000/en-US/firefox/search/?q=aa` and then clicks
      // into the search bar. It should fetch the suggestions only once.
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });

      const { autocomplete: autocompleteState } = store.getState();

      const dispatch = sinon.spy();
      const wrapper = mountBaseComponent({
        dispatch,
        query: 'ad',
        suggestions: autocompleteState.suggestions,
      });

      sinon.assert.notCalled(dispatch);
      expect(wrapper.find(Suggestion)).toHaveLength(0);

      // User clicks somewhere else on the UI, triggering the
      // AUTOCOMPLETE_CANCELLED action.
      store.dispatch(autocompleteCancel());
      wrapper.setProps(mapStateToProps(store.getState()));

      // User focuses the search input.
      wrapper.find('input').simulate('focus');

      // User clicks somewhere else on the UI, triggering the
      // AUTOCOMPLETE_CANCELLED action, again.
      store.dispatch(autocompleteCancel());
      wrapper.setProps(mapStateToProps(store.getState()));

      // User focuses the search input, again.
      wrapper.find('input').simulate('focus');

      expect(wrapper.find(Suggestion)).toHaveLength(
        autocompleteState.suggestions.length
      );

      sinon.assert.callCount(dispatch, 1);
      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { operatingSystem: OS_WINDOWS, query: 'ad' },
      }));
    });

    it('fetches suggestions on focus when query is present but search has changed', () => {
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });

      const { autocomplete: autocompleteState } = store.getState();

      const dispatch = sinon.spy();
      const wrapper = mountBaseComponent({
        dispatch,
        query: 'ad',
        suggestions: autocompleteState.suggestions,
      });

      sinon.assert.notCalled(dispatch);
      expect(wrapper.find(Suggestion)).toHaveLength(0);

      // User focuses the search input, which will load suggestions from the API.
      wrapper.find('input').simulate('focus');

      sinon.assert.callCount(dispatch, 1);
      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { operatingSystem: OS_WINDOWS, query: 'ad' },
      }));
      dispatch.reset();

      // User types 'adb' in the search input, which requires new suggestions
      // to be loaded from the API.
      wrapper.find('input').simulate('change', createFakeChangeEvent('adb'));

      expect(wrapper.find(Suggestion)).toHaveLength(
        autocompleteState.suggestions.length
      );

      sinon.assert.callCount(dispatch, 1);
      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { operatingSystem: OS_WINDOWS, query: 'adb' },
      }));
    });

    it('preserves existing search filters on the query string', () => {
      const dispatch = sinon.spy();
      const locationQuery = { type: ADDON_TYPE_EXTENSION };
      const wrapper = mountBaseComponent({ dispatch, locationQuery });

      const query = 'ad blocker';
      wrapper.find('input')
        .simulate('change', createFakeChangeEvent(query));

      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          operatingSystem: OS_WINDOWS,
          query,
        },
      }));
    });

    it('lets you override the default operating system', () => {
      const dispatch = sinon.spy();
      const locationQuery = { platform: OS_LINUX };
      const wrapper = mountBaseComponent({ dispatch, locationQuery });

      const query = 'ad blocker';
      wrapper.find('input')
        .simulate('change', createFakeChangeEvent(query));

      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: {
          operatingSystem: OS_LINUX,
          query,
        },
      }));
    });

    it('does not preserve the existing search page', () => {
      const dispatch = sinon.spy();
      const locationQuery = { page: 2 };
      const wrapper = mountBaseComponent({ dispatch, locationQuery });

      const query = 'ad blocker';
      wrapper.find('input')
        .simulate('change', createFakeChangeEvent(query));

      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: {
          // The page parameter should not be included.
          operatingSystem: OS_WINDOWS,
          query,
        },
      }));
    });

    it('clears suggestions when input is cleared', () => {
      const fakeDispatch = sinon.stub();
      const wrapper = mountBaseComponent({
        dispatch: fakeDispatch,
        query: 'foo',
      });

      // Clearing the input calls `handleSuggestionsClearRequested()`.
      wrapper.find('input').simulate('change', createFakeChangeEvent());
      sinon.assert.callCount(fakeDispatch, 1);
      sinon.assert.calledWith(fakeDispatch, autocompleteCancel());
      expect(wrapper.state('autocompleteIsOpen')).toEqual(false);
    });

    it('displays suggestions when user is typing', () => {
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });
      const { autocomplete: autocompleteState } = store.getState();

      const wrapper = mountBaseComponent({
        query: 'foo',
        suggestions: autocompleteState.suggestions,
      });
      expect(wrapper.find(Suggestion)).toHaveLength(0);
      // this triggers Autosuggest
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(2);
      expect(wrapper.find(LoadingText)).toHaveLength(0);
      expect(wrapper.find('form'))
        .toHaveClassName('SearchForm--autocompleteIsOpen');
      expect(wrapper.state('autocompleteIsOpen')).toEqual(true);
    });

    it('does not display suggestions when search is empty', () => {
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });
      const { autocomplete: autocompleteState } = store.getState();

      // setting the `query` prop to empty also sets the input state to empty.
      const wrapper = mountBaseComponent({
        query: '',
        suggestions: autocompleteState.suggestions,
      });
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(0);
      expect(wrapper.find('.SearchForm--autocompleteIsOpen')).toHaveLength(0);
    });

    it('does not display suggestions when there is no suggestion', () => {
      const wrapper = mountBaseComponent({ suggestions: [] });

      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(0);
      expect(wrapper.find(LoadingText)).toHaveLength(0);
      expect(wrapper.find('.SearchForm--autocompleteIsOpen')).toHaveLength(0);
    });

    it('does not display suggestions when the API returns nothing', () => {
      // Setting `query` to `fhghfhgfhhgfhghfhgfj` will trigger Autosuggest
      // `onSuggestionsFetchRequested()` method, which normally opens the list
      // of results when focused. Yet, this value does not return any result,
      // which is another edge case.
      const wrapper = mountBaseComponent({
        query: 'fhghfhgfhhgfhghfhgfj',
        suggestions: [],
      });

      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(0);
      expect(wrapper.find(LoadingText)).toHaveLength(0);
      expect(wrapper.find('form'))
        .not.toHaveClassName('SearchForm--autocompleteIsOpen');
      // This value is set to `true` because the autocomplete should be open
      // and this value is controlled by Autosuggest. Because there is no
      // results, Autosuggest does not display anything and we should make the
      // `input` look like if there is no result too.
      expect(wrapper.state('autocompleteIsOpen')).toEqual(true);
    });

    it('displays 10 loading bars when suggestions are loading', () => {
      const { store } = dispatchSignInActions();

      store.dispatch(autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { query: 'test' },
      }));

      const wrapper = mountComponent({ query: 'test', store });
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(LoadingText)).toHaveLength(10);
      expect(wrapper.find('form'))
        .toHaveClassName('SearchForm--autocompleteIsOpen');
    });

    it('updates the state and push a new route when a suggestion is selected', () => {
      const result = createFakeAutocompleteResult();
      const { store } = dispatchAutocompleteResults({ results: [result] });
      const { autocomplete: autocompleteState } = store.getState();

      const wrapper = mountBaseComponent({
        query: 'foo',
        suggestions: autocompleteState.suggestions,
      });
      expect(wrapper.state('searchValue')).toEqual('foo');

      wrapper.find('input').simulate('focus');
      wrapper.find(Suggestion).simulate('click');
      expect(wrapper.state('searchValue')).toEqual('');
      sinon.assert.callCount(fakeRouter.push, 1);
      sinon.assert.calledWith(fakeRouter.push, result.url);
    });

    it('ignores loading suggestions that are selected', () => {
      const result = createFakeAutocompleteResult();
      const { store } = dispatchAutocompleteResults({ results: [result] });
      const { autocomplete: autocompleteState } = store.getState();

      const wrapper = mountBaseComponent({ query: 'baz' });
      expect(wrapper.state('searchValue')).toEqual('baz');

      wrapper.instance().handleSuggestionSelected(createFakeEvent(), {
        suggestion: {
          ...autocompleteState.suggestions[0],
          loading: true,
        },
      });
      expect(wrapper.state('searchValue')).toEqual('baz');
      sinon.assert.notCalled(fakeRouter.push);
    });

    it('does not fetch suggestions when there is no search value', () => {
      const dispatch = sinon.spy();
      const wrapper = mountBaseComponent({ dispatch });

      wrapper.instance().handleSuggestionsFetchRequested({});
      sinon.assert.notCalled(dispatch);
    });
  });

  describe('mapStateToProps', () => {
    it('passes the api through', () => {
      const { store } = dispatchSignInActions();

      const state = store.getState();

      expect(mapStateToProps(state).api).toEqual(state.api);
    });

    it('passes the suggestions through', () => {
      const result = createFakeAutocompleteResult();
      const { store } = dispatchAutocompleteResults({ results: [result] });

      const state = store.getState();

      expect(mapStateToProps(state).suggestions).toEqual([
        {
          iconUrl: result.icon_url,
          name: result.name,
          url: result.url,
        },
      ]);
      expect(mapStateToProps(state).loadingSuggestions).toEqual(false);
    });

    it('passes the loading suggestions boolean through', () => {
      const { store } = dispatchSignInActions();

      store.dispatch(autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { operatingSystem: OS_WINDOWS, query: 'test' },
      }));

      const state = store.getState();

      expect(mapStateToProps(state).loadingSuggestions).toEqual(true);
    });
  });
});
