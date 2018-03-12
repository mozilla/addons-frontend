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
  simulateComponentCallback,
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

  const simulateAutoSearchCallback = (props = {}) => {
    return simulateComponentCallback({
      Component: AutoSearchInput, ...props,
    });
  };

  it('renders a form', () => {
    const root = render();

    expect(root.find('.SearchForm')).toHaveLength(1);
  });

  it('configures an initial query value', () => {
    const query = 'rainbow pandas';
    const root = render({ query });

    expect(root.find(AutoSearchInput)).toHaveProp('query', query);
  });

  it('can render a custom className', () => {
    const className = 'MyClass';
    const root = render({ className });

    expect(root).toHaveClassName(className);
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
    const root = render();

    expect(root.find('form'))
      .toHaveProp('action', root.instance().baseSearchURL());
  });

  it('changes the URL on search', () => {
    const root = render();

    const filters = { query: 'panda themes' };
    simulateAutoSearchCallback({
      args: [filters], root, propName: 'onSearch',
    });

    sinon.assert.calledWith(fakeRouter.push, {
      pathname: root.instance().baseSearchURL(),
      query: convertFiltersToQueryParams(filters),
    });
  });

  it('pushes a new route when a suggestion is selected', () => {
    const root = render();

    const url = '/url/to/extension/detail/page';
    const suggestion = createInternalSuggestion(
      createFakeAutocompleteResult({ url, name: 'uBlock Origin' })
    );
    simulateAutoSearchCallback({
      args: [suggestion], root, propName: 'onSuggestionSelected',
    });

    sinon.assert.calledWith(fakeRouter.push, url);
  });
});
