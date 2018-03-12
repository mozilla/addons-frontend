import * as React from 'react';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import SearchForm, { SearchFormBase } from 'amo/components/SearchForm';
import { CLIENT_APP_FIREFOX } from 'core/constants';
import { createInternalSuggestion } from 'core/reducers/autocomplete';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import {
  createFakeAutocompleteResult,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';
import {
  fakeRouterLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let fakeRouter;

  beforeEach(() => {
    fakeRouter = {
      location: fakeRouterLocation(),
      push: sinon.spy(),
    };
  });

  const getProps = (customProps = {}) => {
    return {
      pathname: '/search/',
      router: fakeRouter,
      store: dispatchClientMetadata().store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);
    return shallowUntilTarget(<SearchForm {...props} />, SearchFormBase);
  };

  const simulateAutoSearchCallback = ({ args = [], wrapper, propName }) => {
    const autoSearch = wrapper.find(AutoSearchInput);
    expect(autoSearch).toHaveProp(propName);

    const callback = autoSearch.prop(propName);
    expect(typeof callback).toEqual('function');

    const result = callback(...args);

    // Since the component might call setState() and that would happen
    // outside of a standard React lifestyle hook, we have to re-render.
    wrapper.update();

    return result;
  };

  it('renders a form', () => {
    const wrapper = render();

    expect(wrapper.find('.SearchForm')).toHaveLength(1);
  });

  it('configures an initial query value', () => {
    const query = 'rainbow pandas';
    const wrapper = render({ query });

    expect(wrapper.find(AutoSearchInput)).toHaveProp('query', query);
  });

  it('can render a custom className', () => {
    const className = 'MyClass';
    const wrapper = render({ className });

    expect(wrapper).toHaveClassName(className);
  });

  it('generates a base search URL', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      lang: 'en-GB',
    });
    const root = render({ store, pathname: '/find-stuff/' });

    expect(root.instance().baseSearchURL())
      .toEqual(`/en-GB/${CLIENT_APP_FIREFOX}/find-stuff/`);
  });

  it('sets the form action URL', () => {
    const wrapper = render();

    expect(wrapper.find('form'))
      .toHaveProp('action', wrapper.instance().baseSearchURL());
  });

  it('changes the URL on search', () => {
    const wrapper = render();

    const filters = { query: 'panda themes' };
    simulateAutoSearchCallback({
      args: [filters],
      wrapper,
      propName: 'onSearch',
    });

    sinon.assert.calledWith(fakeRouter.push, {
      pathname: wrapper.instance().baseSearchURL(),
      query: convertFiltersToQueryParams(filters),
    });
  });

  it('pushes a new route when a suggestion is selected', () => {
    const wrapper = render();

    const url = '/some/url/to/the/extension/detail/page';
    const suggestion = createInternalSuggestion(
      createFakeAutocompleteResult({ url, name: 'uBlock Origin' })
    );
    simulateAutoSearchCallback({
      args: [suggestion],
      wrapper,
      propName: 'onSuggestionSelected',
    });

    sinon.assert.calledWith(fakeRouter.push, url);
  });
});
