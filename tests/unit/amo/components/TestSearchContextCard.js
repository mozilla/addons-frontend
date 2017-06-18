import { shallow } from 'enzyme';
import React from 'react';

import {
  SearchContextCardBase,
  mapStateToProps,
} from 'amo/components/SearchContextCard';
import { searchLoad, searchStart } from 'core/actions/search';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('SearchContextCard', () => {
  function render(props = {}) {
    let { store } = props;

    if (!store) {
      store = dispatchClientMetadata().store;
      store.dispatch(searchStart({ filters: { query: 'test' } }));
    }

    return shallow(
      <SearchContextCardBase
        {...mapStateToProps(store.getState())}
        i18n={getFakeI18nInst()}
        {...props}
      />
    );
  }

  it('should render a card', () => {
    const root = render();

    expect(root).toHaveClassName('SearchContextCard');
  });

  it('should render "searching" while loading without query', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchStart({ filters: {} }));

    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('Loading add-ons');
  });

  it('should render during a search that is loading', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchStart({ filters: { query: 'test' } }));

    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('Searching for "test"');
  });

  it('should render search results', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchStart({ filters: { query: 'test' } }));
    store.dispatch(searchLoad({
      entities: {
        addons: {
          [fakeAddon.slug]: fakeAddon,
          'some-other-slug': { ...fakeAddon, slug: 'some-other-slug' },
        },
      },
      filters: { query: 'test' },
      result: {
        count: 2,
        results: [fakeAddon.slug, 'some-other-slug'],
      },
    }));

    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('2 results for "test"');
  });

  it('should render results that lack a query', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchStart({ filters: { query: 'test' } }));
    store.dispatch(searchLoad({
      entities: {
        addons: {
          [fakeAddon.slug]: fakeAddon,
          'some-other-slug': { ...fakeAddon, slug: 'some-other-slug' },
        },
      },
      filters: {},
      result: {
        count: 2,
        results: [fakeAddon.slug, 'some-other-slug'],
      },
    }));

    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('2 add-ons found');
  });

  it('should use singular form when only one result is found', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchLoad({
      entities: {
        addons: {
          [fakeAddon.slug]: fakeAddon,
        },
      },
      filters: { query: 'test' },
      result: {
        count: 1,
        results: [fakeAddon.slug],
      },
    }));

    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('1 result for "test"');
  });

  it('should use singular form without query when only one result', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchLoad({
      entities: {
        addons: {
          [fakeAddon.slug]: fakeAddon,
        },
      },
      filters: {},
      result: {
        count: 1,
        results: [fakeAddon.slug],
      },
    }));

    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('1 add-on found');
  });

  it('should render empty results', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(searchLoad({
      entities: { addons: {} },
      filters: {},
      result: { count: 0, results: [] },
    }));

    const root = render({ store });

    expect(root.find('.SearchContextCard-header'))
      .toIncludeText('No add-ons found');
  });
});
