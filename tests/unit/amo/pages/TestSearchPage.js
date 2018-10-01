import * as React from 'react';

import Search from 'amo/components/Search';
import SearchPage, {
  SearchPageBase,
  mapStateToProps,
} from 'amo/pages/SearchPage';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX, OS_MAC } from 'core/constants';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { createFakeLocation, shallowUntilTarget } from 'tests/unit/helpers';

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
          featured: true,
          page: 2,
          q: 'burger',
          tag: 'firefox57',
        },
      }),
    });

    expect(root.find(Search)).toHaveProp('paginationQueryParams', {
      featured: true,
      page: 2,
      q: 'burger',
      tag: 'firefox57',
    });
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

  it('dispatches a server redirect when `atype` parameter is "4"', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { atype: 4 } }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/search/?type=search',
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

  it('dispatches a server redirect when `atype` parameter is "9"', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { atype: 9 } }),
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/search/?type=persona',
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

  it('dispatches a server redirect when `platform` parameter is "all"', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { platform: 'all' } }),
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

  it('does not dispatch a server redirect when `platform` is not "all"', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({
      location: createFakeLocation({ query: { platform: OS_MAC } }),
      store,
    });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('redirects without affecting the other parameters', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');
    const query = { page: 123, platform: 'all' };

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

  describe('mapStateToProps()', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { state } = dispatchClientMetadata({ clientApp });
    const location = createFakeLocation({
      query: {
        page: 2,
        q: 'burger',
      },
    });

    it('returns filters based on location (URL) data', () => {
      expect(mapStateToProps(state, { location })).toEqual({
        clientApp: CLIENT_APP_FIREFOX,
        lang: 'en-US',
        filters: {
          page: 2,
          query: 'burger',
        },
      });
    });

    it("ignores clientApp in location's queryParams", () => {
      const badLocation = {
        ...location,
        query: { ...location.query, app: CLIENT_APP_ANDROID },
      };

      expect(mapStateToProps(state, { location: badLocation })).toEqual({
        clientApp: CLIENT_APP_FIREFOX,
        lang: 'en-US',
        filters: {
          page: 2,
          query: 'burger',
        },
      });
    });

    it("ignores lang in location's queryParams", () => {
      const badLocation = {
        ...location,
        query: { ...location.query, lang: 'fr' },
      };

      expect(mapStateToProps(state, { location: badLocation })).toEqual({
        clientApp: CLIENT_APP_FIREFOX,
        lang: 'en-US',
        filters: {
          page: 2,
          query: 'burger',
        },
      });
    });
  });
});
