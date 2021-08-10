import * as React from 'react';

import Search from 'amo/components/Search';
import SearchPage, { SearchPageBase } from 'amo/pages/SearchPage';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_CATEGORY_SORT,
  SEARCH_SORT_RECOMMENDED,
} from 'amo/constants';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import {
  createFakeLocation,
  dispatchClientMetadata,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  function render({
    location = createFakeLocation({ query: { page: 2, q: 'burger' } }),
    ...props
  } = {}) {
    return shallowUntilTarget(
      <SearchPage location={location} store={store} {...props} />,
      SearchPageBase,
    );
  }

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('renders a SearchPage', () => {
    const root = render();

    expect(root.find(Search)).toHaveLength(1);
  });

  it('enables search filters', () => {
    const root = render();

    expect(root.find(Search)).toHaveProp('enableSearchFilters', true);
  });

  it("doesn't duplicate the clientApp in the URL in the queryParams", () => {
    const root = render({
      location: createFakeLocation({ query: { page: 3, q: 'fries' } }),
    });

    expect(root.find(Search).prop('paginationQueryParams')).toEqual({
      page: 3,
      q: 'fries',
    });
  });

  it('sets the paginationQueryParams from filters', () => {
    const root = render({
      location: createFakeLocation({
        query: {
          page: 2,
          q: 'burger',
          tag: 'firefox57',
        },
      }),
    });

    expect(root.find(Search)).toHaveProp('paginationQueryParams', {
      page: 2,
      q: 'burger',
      tag: 'firefox57',
    });
  });

  it('sets the filters from the location', () => {
    const page = 2;
    const q = 'burger';
    const tag = 'firefox57';
    const root = render({
      location: createFakeLocation({
        query: { page, q, tag },
      }),
    });

    expect(root.find(Search)).toHaveProp('filters', { page, query: q, tag });
  });

  it('preserves category in paginationQueryParams', () => {
    const query = {
      // The API is responsible for defining category strings.
      category: 'some-category',
    };

    const root = render({
      location: createFakeLocation({
        query: { ...query, q: 'search term' },
      }),
    });

    const params = root.find(Search).prop('paginationQueryParams');
    expect(params).toMatchObject(query);
  });

  it('dispatches a server redirect when `atype` parameter is "1"', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { atype: 1 } }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/search/?type=extension',
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('uses the clientApp from the API and not the location', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    dispatchClientMetadata({ clientApp, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({
        clientApp: CLIENT_APP_ANDROID,
        query: { atype: 1 },
      }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}/search/?type=extension`,
      }),
    );
  });

  it('uses the lang from the API and not the location', () => {
    const lang = 'en-CA';
    dispatchClientMetadata({ lang, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({
        lang: 'fr',
        query: { atype: 1 },
      }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/${lang}/android/search/?type=extension`,
      }),
    );
  });

  it('dispatches a server redirect when `atype` parameter is "3"', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { atype: 3 } }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/search/?type=dictionary',
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('dispatches a server redirect when `atype` parameter is "5"', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { atype: 5 } }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/search/?type=language',
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('does not dispatch a server redirect when `atype` has no mapping', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // The `atype` value has no corresponding `addonType`.
    render({
      location: createFakeLocation({ query: { atype: 123 } }),
      store,
    });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches a server redirect when `category` and `addonType` are set', () => {
    const category = 'some-category';
    const page = '123';
    dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({
        query: {
          category,
          page,
          sort: SEARCH_SORT_RECOMMENDED,
          type: ADDON_TYPE_EXTENSION,
        },
      }),
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${CLIENT_APP_FIREFOX}/extensions/category/${category}/?page=${page}&sort=${SEARCH_SORT_RECOMMENDED}`,
      }),
    );
  });

  it('does not dispatch a server redirect when category is set along with an invalid `addonType`', () => {
    const category = 'some-category';
    const page = '123';
    dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({
        query: {
          category,
          page,
          sort: SEARCH_SORT_RECOMMENDED,
          type: 'invalid',
        },
      }),
      store,
    });

    sinon.assert.callCount(fakeDispatch, 0);
  });

  it('removes the default category sort, when present, when redirecting', () => {
    const category = 'some-category';
    const page = '123';
    dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({
        query: {
          category,
          page,
          sort: DEFAULT_CATEGORY_SORT,
          type: ADDON_TYPE_EXTENSION,
        },
      }),
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${CLIENT_APP_FIREFOX}/extensions/category/${category}/?page=${page}`,
      }),
    );
  });

  it('dispatches a server redirect when `tag` is set', () => {
    const tag = 'some-tag';
    const page = '123';
    dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({
        query: {
          tag,
          page,
          sort: SEARCH_SORT_RECOMMENDED,
          type: ADDON_TYPE_EXTENSION,
        },
      }),
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${CLIENT_APP_FIREFOX}/tag/${tag}/?page=${page}&sort=${SEARCH_SORT_RECOMMENDED}&type=extension`,
      }),
    );
  });

  it('removes the default tag sort, when present, when redirecting', () => {
    const tag = 'some-tag';
    const page = '123';
    dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({
        query: {
          tag,
          page,
          sort: DEFAULT_CATEGORY_SORT,
        },
      }),
      store,
    });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${CLIENT_APP_FIREFOX}/tag/${tag}/?page=${page}`,
      }),
    );
  });

  it('dispatches a server redirect when `platform` is set', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { platform: 'whatever' } }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/search/',
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('redirects without affecting the other parameters', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const query = { page: '123', platform: 'all' };

    render({ location: createFakeLocation({ query }), store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/search/?page=123',
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });
});
