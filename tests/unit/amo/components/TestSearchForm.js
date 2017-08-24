import { mount } from 'enzyme';
import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import {
  SearchFormBase,
  mapStateToProps,
} from 'amo/components/SearchForm';
import Suggestion from 'amo/components/SearchForm/Suggestion';
import LoadingText from 'ui/components/LoadingText';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_THEME,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import {
  createFakeAutocompleteResult,
  dispatchAutocompleteResults,
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  getFakeI18nInst,
} from 'tests/unit/helpers';
import {
  autocompleteCancel,
  autocompleteStart,
} from 'core/reducers/autocomplete';


describe(__filename, () => {
  const pathname = '/search/';
  const api = { clientApp: 'firefox', lang: 'de' };
  let errorHandler;
  let router;

  const mountComponent = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return mount(
      <SearchFormBase
        api={api}
        debounce={(callback) => (...args) => callback(...args)}
        dispatch={() => {}}
        errorHandler={errorHandler}
        i18n={getFakeI18nInst()}
        loadingSuggestions={false}
        pathname={pathname}
        store={store}
        suggestions={[]}
        router={router}
        {...props}
      />
    );
  };

  const createFakeChangeEvent = (value = '') => {
    return createFakeEvent({
      target: { value },
    });
  };

  describe('render/UI', () => {
    beforeEach(() => {
      errorHandler = createStubErrorHandler();
      router = { push: sinon.spy() };
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

    it('renders Dictionary placeholder', () => {
      const wrapper = mountComponent({
        addonType: ADDON_TYPE_DICT,
      });
      const input = wrapper.find('input');

      expect(input).toHaveProp('placeholder', 'Find dictionary');
      expect(input).toHaveProp('type', 'search');
    });

    it('renders Extensions placeholder', () => {
      const wrapper = mountComponent({
        addonType: ADDON_TYPE_EXTENSION,
      });
      const input = wrapper.find('input');

      expect(input).toHaveProp('placeholder', 'Find extensions');
      expect(input).toHaveProp('type', 'search');
    });

    it('renders Language Pack placeholder', () => {
      const wrapper = mountComponent({
        addonType: ADDON_TYPE_LANG,
      });
      const input = wrapper.find('input');

      expect(input).toHaveProp('placeholder', 'Find language pack');
      expect(input).toHaveProp('type', 'search');
    });

    it('renders Themes placeholder', () => {
      const wrapper = mountComponent({
        addonType: ADDON_TYPE_THEME,
      });
      const input = wrapper.find('input');

      expect(input).toHaveProp('placeholder', 'Find themes');
      expect(input).toHaveProp('type', 'search');
    });

    it('renders the query', () => {
      const wrapper = mountComponent({ query: 'foo' });

      expect(wrapper.find('.SearchForm-query').prop('value')).toEqual('foo');
    });

    it('changes the URL on submit', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(router.push);
      wrapper.find('.SearchForm-query').simulate(
        'change', createFakeChangeEvent('adblock'));
      wrapper.find('form').simulate('submit');
      sinon.assert.called(router.push);
    });

    it('blurs the form on submit', () => {
      const wrapper = mountComponent();
      const blurSpy = sinon.spy(
        wrapper.instance().autocomplete.input, 'blur');

      sinon.assert.notCalled(blurSpy);
      wrapper.find('input').simulate(
        'change', createFakeChangeEvent('something'));
      wrapper.find('form').simulate('submit');
      sinon.assert.called(blurSpy);
    });

    it('does nothing on non-Enter keydowns', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(router.push);
      wrapper.find('input').simulate('change', createFakeChangeEvent('adblock'));
      wrapper.find('input').simulate('keydown', { key: 'A', shiftKey: true });
      sinon.assert.notCalled(router.push);
    });

    it('updates the location on form submit', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(router.push);
      wrapper.find('input').simulate(
        'change', createFakeChangeEvent('adblock'));
      wrapper.find('button').simulate('click');
      sinon.assert.called(router.push);
    });

    it('passes addonType when set', () => {
      const wrapper = mountComponent({
        addonType: ADDON_TYPE_EXTENSION,
      });

      sinon.assert.notCalled(router.push);
      wrapper.find('input').simulate(
        'change', createFakeChangeEvent('& 26 %'));
      wrapper.find('button').simulate('click');
      sinon.assert.calledWith(router.push, {
        pathname: '/de/firefox/search/',
        query: { q: '& 26 %', type: ADDON_TYPE_EXTENSION },
      });
    });

    it('does not set type when it is not defined', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(router.push);
      wrapper.find('input').simulate(
        'change', createFakeChangeEvent('searching'));
      wrapper.find('button').simulate('click');
      sinon.assert.calledWith(router.push, {
        pathname: '/de/firefox/search/',
        query: { q: 'searching' },
      });
    });

    it('encodes the value of the search text', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(router.push);
      wrapper.find('input').simulate(
        'change', createFakeChangeEvent('& 26 %'));
      wrapper.find('button').simulate('click');
      sinon.assert.calledWith(router.push, {
        pathname: '/de/firefox/search/',
        query: { q: '& 26 %' },
      });
    });

    it('updates the state when props update', () => {
      const wrapper = mountComponent({ query: '' });
      expect(wrapper.state('searchValue')).toEqual('');

      wrapper.setProps({ query: 'foo' });
      expect(wrapper.state('searchValue')).toEqual('foo');
    });

    it('updates the state when user is typing', () => {
      const wrapper = mountComponent({ query: '' });
      expect(wrapper.state('searchValue')).toEqual('');

      wrapper.find('input').simulate('change', createFakeChangeEvent('foo'));
      expect(wrapper.state('searchValue')).toEqual('foo');

      wrapper.find('input').simulate(
        'change', createFakeChangeEvent(undefined));
      expect(wrapper.state('searchValue')).toEqual('');
    });

    it('fetches suggestions on focus', () => {
      const dispatch = sinon.spy();
      const wrapper = mountComponent({
        query: 'foo',
        dispatch,
      });
      // Expect no call to to handleSuggestionsFetchRequested() until the input
      // has focus, even if there is already a `searchValue`
      sinon.assert.notCalled(dispatch);
      // This is needed to trigger handleSuggestionsFetchRequested()
      wrapper.find('input').simulate('focus');
      sinon.assert.callCount(dispatch, 1);
      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: {
          query: 'foo',
        },
      }));
    });

    it('clears suggestions when input is cleared', () => {
      const dispatch = sinon.spy();
      const wrapper = mountComponent({
        query: 'foo',
        dispatch,
      });
      // clearing the input calls handleSuggestionsClearRequested()
      wrapper.find('input').simulate('change', createFakeChangeEvent());
      sinon.assert.callCount(dispatch, 1);
      sinon.assert.calledWith(dispatch, autocompleteCancel());
    });

    it('displays suggestions when user is typing', () => {
      const { store } = dispatchAutocompleteResults({ results: [
        createFakeAutocompleteResult(),
        createFakeAutocompleteResult(),
      ] });
      const { autocomplete: autocompleteState } = store.getState();

      const wrapper = mountComponent({
        query: 'foo',
        suggestions: autocompleteState.suggestions,
      });
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
      const wrapper = mountComponent({
        query: '',
        suggestions: autocompleteState.suggestions,
      });
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(0);
    });

    it('does not display suggestions when there is no suggestion', () => {
      const wrapper = mountComponent({ suggestions: [] });

      wrapper.find('input').simulate('focus');
      expect(wrapper.find(Suggestion)).toHaveLength(0);
      expect(wrapper.find(LoadingText)).toHaveLength(0);
    });

    it('displays 10 loading bars when suggestions are loading', () => {
      const { store } = dispatchSignInActions();

      store.dispatch(autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { query: 'test' },
      }));

      const wrapper = mountComponent({
        ...mapStateToProps(store.getState()),
        query: 'test',
      });
      wrapper.find('input').simulate('focus');
      expect(wrapper.find(LoadingText)).toHaveLength(10);
    });

    it('updates the state and push a new route when a suggestion is selected', () => {
      const result = createFakeAutocompleteResult();
      const { store } = dispatchAutocompleteResults({ results: [result] });
      const { autocomplete: autocompleteState } = store.getState();

      const wrapper = mountComponent({
        query: 'foo',
        suggestions: autocompleteState.suggestions,
      });
      expect(wrapper.state('searchValue')).toEqual('foo');

      wrapper.find('input').simulate('focus');
      wrapper.find(Suggestion).simulate('click');
      expect(wrapper.state('searchValue')).toEqual('');
      sinon.assert.callCount(router.push, 1);
      sinon.assert.calledWith(router.push, result.url);
    });

    it('ignores loading suggestions that are selected', () => {
      const result = createFakeAutocompleteResult();
      const { store } = dispatchAutocompleteResults({ results: [result] });
      const { autocomplete: autocompleteState } = store.getState();

      const wrapper = mountComponent({ query: 'baz' });
      expect(wrapper.state('searchValue')).toEqual('baz');

      wrapper.instance().handleSuggestionSelected(createFakeEvent(), {
        suggestion: {
          ...autocompleteState.suggestions[0],
          loading: true,
        },
      });
      expect(wrapper.state('searchValue')).toEqual('baz');
      sinon.assert.notCalled(router.push);
    });

    it('does not fetch suggestions when there is not value', () => {
      const dispatch = sinon.spy();
      const wrapper = mountComponent({ dispatch });

      wrapper.instance().handleSuggestionsFetchRequested({});
      sinon.assert.notCalled(dispatch);
    });

    it('adds addonType to the filters used to fetch suggestions', () => {
      const dispatch = sinon.spy();
      const wrapper = mountComponent({
        query: 'ad',
        addonType: ADDON_TYPE_EXTENSION,
        dispatch,
      });

      wrapper.find('input').simulate('focus');

      sinon.assert.callCount(dispatch, 1);
      sinon.assert.calledWith(dispatch, autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: {
          query: 'ad',
          addonType: ADDON_TYPE_EXTENSION,
        },
      }));
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
      expect(mapStateToProps(state).loadingSuggestions).toEqual(false);
    });

    it('passes the loading suggestions boolean through', () => {
      const { store } = dispatchSignInActions();

      store.dispatch(autocompleteStart({
        errorHandlerId: errorHandler.id,
        filters: { query: 'test' },
      }));

      const state = store.getState();

      expect(mapStateToProps(state).loadingSuggestions).toEqual(true);
    });
  });
});
