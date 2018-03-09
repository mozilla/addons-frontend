import { mount } from 'enzyme';
import * as React from 'react';

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
  fakeRouterLocation,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let fakeRouter;

  beforeEach(() => {
    // The `withRouter()` HOC passes `location` from `router.location`
    // to the component. In other words, `location` cannot be set directly.
    fakeRouter = {
      location: fakeRouterLocation(),
      push: sinon.spy(),
    };
  });

  const getProps = (customProps = {}) => {
    return {
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
      location: fakeRouterLocation({ query: { ...locationQuery } }),
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
    it('renders a form', () => {
      const wrapper = mountComponent();

      expect(wrapper.find('.SearchForm')).toHaveLength(1);
    });

    it('changes the URL on submit', () => {
      const wrapper = mountComponent();

      sinon.assert.notCalled(fakeRouter.push);
      wrapper.find('.SearchForm-query').simulate(
        'change', createFakeChangeEvent('adblock'));
      wrapper.find('form').simulate('submit');
      sinon.assert.called(fakeRouter.push);
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
  });
});
