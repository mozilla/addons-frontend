import React from 'react';

import Link from 'amo/components/Link';
import SearchLink, { SearchLinkBase } from 'amo/components/SearchLink';
import {
  convertFiltersToQueryParams,
  convertOSToFilterValue,
} from 'core/searchUtils';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  function shallowRender({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return shallowUntilTarget(
      <SearchLink store={store} {...props} />,
      SearchLinkBase);
  }

  it('outputs a link', () => {
    const root = shallowRender({ filters: { query: 'test!' } });

    expect(root.find(Link)).toHaveLength(1);
  });

  it("uses `/search/` as the link's `pathname`", () => {
    const root = shallowRender({ filters: { query: 'test!' } });

    expect(root.find(Link).prop('to')).toMatchObject({
      pathname: '/search/',
    });
  });

  it('passes other props through to Link', () => {
    const root = shallowRender({
      className: 'CoolSearchClass',
      filters: { query: 'test!' },
    });

    expect(root.find(Link)).toHaveProp('className', 'CoolSearchClass');
  });

  it('sets the OS by default', () => {
    const { store } = dispatchClientMetadata();
    const root = shallowRender({
      filters: { query: 'test!' },
      store,
    });

    expect(root.find(Link)).toHaveProp('to', {
      pathname: '/search/',
      query: convertFiltersToQueryParams({
        operatingSystem: convertOSToFilterValue(
          store.getState().api.userAgentInfo.os.name
        ),
        query: 'test!',
      }),
    });
  });

  it('omits the OS if setOperatingSystem is `false`', () => {
    const { store } = dispatchClientMetadata();
    const root = shallowRender({
      filters: { query: 'test!' },
      setOperatingSystem: false,
      store,
    });

    expect(root.find(Link)).toHaveProp('to', {
      pathname: '/search/',
      query: convertFiltersToQueryParams({ query: 'test!' }),
    });
  });

  it('omits operatingSystem if it is not known', () => {
    const { store } = dispatchClientMetadata({ userAgent: 'tofuBrowser' });
    const root = shallowRender({
      filters: { query: 'test!' },
      store,
    });

    expect(root.find(Link)).toHaveProp('to', {
      pathname: '/search/',
      query: convertFiltersToQueryParams({ query: 'test!' }),
    });
  });
});
