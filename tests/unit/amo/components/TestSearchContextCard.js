import { shallow } from 'enzyme';
import React from 'react';

import {
  SearchContextCardBase,
  mapStateToProps,
} from 'amo/components/SearchContextCard';
import { searchStart } from 'core/actions/search';
import {
  dispatchClientMetadata,
  dispatchSearchResults,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('SearchContextCard', () => {
  function render(props) {
    const store = props.store || dispatchClientMetadata().store;

    return shallow(
      <SearchContextCardBase
        {...mapStateToProps(store.getState())}
        i18n={getFakeI18nInst()}
        {...props}
      />
    );
  }

  it('should render a card', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    expect(root).toHaveClassName('SearchContextCard');
  });

  it('should render "searching" while loading without query', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchStart({
      errorHandlerId: 'Search',
      filters: {},
      page: 1,
      results: [],
    }));
    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('Loading add-ons');
  });

  it('should render during a search that is loading', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchStart({
      errorHandlerId: 'Search',
      filters: { query: 'test' },
      page: 1,
      results: [],
    }));
    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('Searching for "test"');
  });

  it('should render search results', () => {
    const { store } = dispatchSearchResults();
    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('2 results for "test"');
  });

  it('should render results that lack a query', () => {
    const { store } = dispatchSearchResults({ filters: {} });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('2 add-ons found');
  });

  it('should use singular form when only one result is found', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
    });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('1 result for "test"');
  });

  it('should use singular form without query when only one result', () => {
    const { store } = dispatchSearchResults({
      addons: { [fakeAddon.slug]: fakeAddon },
      filters: {},
    });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('1 add-on found');
  });

  it('should render empty results', () => {
    const { store } = dispatchSearchResults({ addons: [], filters: {} });
    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('No add-ons found');
  });
});
