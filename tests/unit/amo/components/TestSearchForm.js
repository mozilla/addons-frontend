import React from 'react';
import { mount } from 'enzyme';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import { setViewContext } from 'amo/actions/viewContext';
import {
  SearchFormBase,
  mapStateToProps,
} from 'amo/components/SearchForm';
import Suggestion from 'amo/components/SearchForm/Suggestion';
import LoadingText from 'ui/components/LoadingText';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import {
  createFakeAutocompleteResult,
  dispatchAutocompleteResults,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import { createFakeChangeEvent, getFakeI18nInst } from 'tests/unit/helpers';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'core/reducers/autocomplete';


describe(__filename, () => {
  const pathname = '/search/';
  const api = { clientApp: 'firefox', lang: 'de' };
  let router;
  let root;
  let form;
  let input;

  const getComponentUnderTest = (props = {}) => {
    return (
      <SearchFormBase
        pathname={pathname}
        api={api}
        query="foo"
        i18n={getFakeI18nInst()}
        loadingSuggestions={false}
        suggestions={[]}
        errorHandler={{ id: 'error-handler-id' }}
        dispatch={() => {}}
        router={router}
        debounce={(callback) => (...args) => callback(...args)}
        {...props}
      />
    );
  };

  describe('render/UI', () => {
    beforeEach(() => {
      router = { push: sinon.spy() };
      root = renderIntoDocument(getComponentUnderTest());
      form = root.form;
      input = root.searchInput;
    });

    it('renders a form', () => {
      expect(form.classList.contains('SearchForm-form')).toBeTruthy();
    });

    it('renders a search input with Explore placeholder', () => {
      expect(input.placeholder).toEqual('Search extensions and themes');
      expect(input.type).toEqual('search');
    });

    it('renders Extensions placeholder', () => {
      root = renderIntoDocument(getComponentUnderTest({
        addonType: ADDON_TYPE_EXTENSION,
      }));
      input = root.searchInput;

      expect(input.placeholder).toEqual('Search extensions');
      expect(input.type).toEqual('search');
    });

    it('renders Themes placeholder', () => {
      root = renderIntoDocument(getComponentUnderTest({
        addonType: ADDON_TYPE_THEME,
      }));
      input = root.searchInput;

      expect(input.placeholder).toEqual('Search themes');
      expect(input.type).toEqual('search');
    });

    it('renders the query', () => {
      expect(input.value).toEqual('foo');
    });

    it('changes the URL on submit', () => {
      sinon.assert.notCalled(router.push);
      input.value = 'adblock';
      Simulate.submit(form);
      sinon.assert.called(router.push);
    });

    it('blurs the form on submit', () => {
      const blurSpy = sinon.stub(input, 'blur');
      expect(!blurSpy.called).toBeTruthy();
      input.value = 'something';
      Simulate.submit(form);
      sinon.assert.called(blurSpy);
    });

    it('does nothing on non-Enter keydowns', () => {
      sinon.assert.notCalled(router.push);
      input.value = 'adblock';
      Simulate.keyDown(input, { key: 'A', shiftKey: true });
      sinon.assert.notCalled(router.push);
    });

    it('updates the location on form submit', () => {
      sinon.assert.notCalled(router.push);
      input.value = 'adblock';
      Simulate.click(root.submitButton);
      sinon.assert.called(router.push);
    });

    it('passes addonType when set', () => {
      root = renderIntoDocument(getComponentUnderTest({
        addonType: ADDON_TYPE_EXTENSION,
      }));
      form = root.form;
      input = root.searchInput;

      sinon.assert.notCalled(router.push);
      input.value = '& 26 %';
      Simulate.click(root.submitButton);
      sinon.assert.calledWith(router.push, {
        pathname: '/de/firefox/search/',
        query: { q: '& 26 %', type: ADDON_TYPE_EXTENSION },
      });
    });

    it('does not set type when it is not defined', () => {
      sinon.assert.notCalled(router.push);
      input.value = 'searching';
      Simulate.click(root.submitButton);
      sinon.assert.calledWith(router.push, {
        pathname: '/de/firefox/search/',
        query: { q: 'searching' },
      });
    });

    it('encodes the value of the search text', () => {
      sinon.assert.notCalled(router.push);
      input.value = '& 26 %';
      Simulate.click(root.submitButton);
      sinon.assert.calledWith(router.push, {
        pathname: '/de/firefox/search/',
        query: { q: '& 26 %' },
      });
    });

    it('updates the state when props update', () => {
      const wrapper = mount(getComponentUnderTest({ query: '' }));
      expect(wrapper.state('searchValue')).toEqual('');

      wrapper.setProps({ query: 'foo' });
      expect(wrapper.state('searchValue')).toEqual('foo');
    });

    it('updates the state when user is typing', () => {
      const wrapper = mount(getComponentUnderTest({ query: '' }));
      expect(wrapper.state('searchValue')).toEqual('');

      wrapper.find('input').simulate('change', createFakeChangeEvent('foo'));
      expect(wrapper.state('searchValue')).toEqual('foo');

      wrapper.find('input').simulate('change', createFakeChangeEvent(undefined));
      expect(wrapper.state('searchValue')).toEqual('');
    });

    it('fetches suggestions on focus', () => {
      const dispatch = sinon.spy();
      const wrapper = mount(getComponentUnderTest({
        query: 'foo',
        dispatch,
      }));
      // no call to handleSuggestionsFetchRequested() until the input has focus,
      // even if there is already a `searchValue`
      expect(dispatch.calledOnce).toBe(false);
      // this is needed to trigger handleSuggestionsFetchRequested()
      wrapper.find('input').simulate('focus');
      expect(dispatch.calledOnce).toBe(true);
    });

    it('clears suggestions when input is cleared', () => {
      const dispatch = sinon.spy();
      const wrapper = mount(getComponentUnderTest({
        query: 'foo',
        dispatch,
      }));
      // clearing the input calls handleSuggestionsClearRequested()
      wrapper.find('input').simulate('change', createFakeChangeEvent());
      expect(dispatch.calledOnce).toBe(true);
      expect(dispatch.calledWith(autocompleteCancel())).toBe(true);
    });

    it('displays suggestions when user is typing', () => {
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });
      const { autocomplete: autocompleteState } = store.getState();

      // it works because the `query` prop is set to `foo` in the
      // getComponentUnderTest(), and this prop sets `searchValue` state
      // (input).
      const wrapper = mount(getComponentUnderTest({
        suggestions: autocompleteState.suggestions,
      }));
      expect(wrapper.find(Suggestion)).toHaveLength(0);
      // this triggers Autosuggest
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(2);
      expect(wrapper.find(LoadingText)).toHaveLength(0);
    });

    it('does not display suggestions when search is empty', () => {
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });
      const { autocomplete: autocompleteState } = store.getState();

      // setting the `query` prop to empty also sets the input state to empty.
      const wrapper = mount(getComponentUnderTest({
        query: '',
        suggestions: autocompleteState.suggestions,
      }));
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(0);
    });

    it('does not display suggestions when there is no suggestion', () => {
      const wrapper = mount(getComponentUnderTest({ suggestions: [] }));
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(0);
      expect(wrapper.find(LoadingText)).toHaveLength(0);
    });

    it('displays 10 loading bars when suggestions are loading', () => {
      const wrapper = mount(getComponentUnderTest({
        suggestions: [],
        loadingSuggestions: true,
      }));
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(LoadingText)).toHaveLength(10);
    });

    it('updates the state and push a new route when a suggestion is selected', () => {
      const result = createFakeAutocompleteResult();
      const { store } = dispatchAutocompleteResults({ results: [result] });
      const { autocomplete: autocompleteState } = store.getState();

      const wrapper = mount(getComponentUnderTest({
        query: 'foo',
        suggestions: autocompleteState.suggestions,
      }));
      expect(wrapper.state('searchValue')).toBe('foo');

      wrapper.find('input').simulate('focus');
      wrapper.find(Suggestion).simulate('click');
      expect(wrapper.state('searchValue')).toBe('');
      expect(router.push.calledOnce).toBe(true);
      expect(router.push.calledWith(result.url)).toBe(true);
    });
  });

  describe('mapStateToProps', () => {
    it('passes the api through', () => {
      const { store } = dispatchSignInActions();

      const state = store.getState();

      expect(mapStateToProps(state).api).toEqual(state.api);
    });

    it('passes the context through', () => {
      const { store } = dispatchSignInActions();
      store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));

      const state = store.getState();

      expect(mapStateToProps(state).addonType).toEqual(ADDON_TYPE_EXTENSION);
    });

    it('does not set addonType if context is not a validAddonType', () => {
      const { store } = dispatchSignInActions();
      store.dispatch(setViewContext(VIEW_CONTEXT_HOME));

      const state = store.getState();

      expect(mapStateToProps(state).addonType).toEqual(null);
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
      expect(mapStateToProps(state).loadingSuggestions).toBe(false);
    });

    it('passes the loading suggestions boolean through', () => {
      const { store } = dispatchSignInActions();

      store.dispatch(autocompleteStart({
        errorHandlerId: 'some-error',
        filters: { query: 'test' },
      }));

      const state = store.getState();

      expect(mapStateToProps(state).loadingSuggestions).toBe(true);
    });
  });
});
