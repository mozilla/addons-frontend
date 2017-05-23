import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  scryRenderedComponentsWithType,
} from 'react-addons-test-utils';
import { normalize } from 'normalizr';
import { Provider } from 'react-redux';
import { findDOMNode } from 'react-dom';

import * as amoApi from 'amo/api';
import createStore from 'amo/store';
import { setAddonReviews } from 'amo/actions/reviews';
import {
  AddonReviewListBase,
  loadAddonReviews,
  loadInitialData,
  mapStateToProps,
} from 'amo/components/AddonReviewList';
import Link from 'amo/components/Link';
import Paginate from 'core/components/Paginate';
import translate from 'core/i18n/translate';
import { loadEntities } from 'core/actions';
import * as coreApi from 'core/api';
import { denormalizeAddon } from 'core/reducers/addons';
import { initialApiState } from 'core/reducers/api';
import I18nProvider from 'core/i18n/Provider';
import Rating from 'ui/components/Rating';
import { fakeAddon, fakeReview } from 'tests/client/amo/helpers';
import {
  apiResponsePage, getFakeI18nInst, unexpectedSuccess,
} from 'tests/client/helpers';

function getLoadedReviews({
  addonSlug = fakeAddon.slug, reviews = [fakeReview], reviewCount = 1 } = {},
) {
  const action = setAddonReviews({ addonSlug, reviewCount, reviews });
  // This is how reviews look after they have been loaded.
  return action.payload.reviews;
}

function createFetchAddonResult(addon) {
  // Simulate how callApi() applies the add-on schema to
  // the API server response.
  return normalize(addon, coreApi.addon);
}

describe('amo/components/AddonReviewList', () => {
  describe('<AddonReviewListBase/>', () => {
    function render({
      addon = fakeAddon,
      params = {
        addonSlug: fakeAddon.slug,
      },
      reviews = [fakeReview],
      ...customProps
    } = {}) {
      const loadedReviews = reviews ? getLoadedReviews({ reviews }) : null;
      const { store } = createStore();
      const props = {
        addon: addon && denormalizeAddon(addon),
        location: { query: {} },
        params,
        reviewCount: loadedReviews && loadedReviews.length,
        reviews: loadedReviews,
        ...customProps,
      };

      const AddonReviewList = translate({ withRef: true })(AddonReviewListBase);
      const tree = renderIntoDocument(
        <Provider store={store}>
          <I18nProvider i18n={getFakeI18nInst()}>
            <AddonReviewList {...props} />
          </I18nProvider>
        </Provider>
      );

      return tree;
    }

    function renderToDOM(...args) {
      return findDOMNode(render(...args));
    }

    it('requires an addonSlug property', () => {
      expect(() => render({ params: { addonSlug: null } }))
        .toThrowError(/addonSlug cannot be falsey/);
    });

    it('waits for reviews to load', () => {
      const root = renderToDOM({ reviews: null });
      expect(root.textContent).toEqual('Loading...');
    });

    it('renders a list of reviews with ratings', () => {
      const reviews = [
        { ...fakeReview, rating: 1 },
        { ...fakeReview, rating: 2 },
      ];
      const tree = render({ reviews });
      const ratings = scryRenderedComponentsWithType(tree, Rating);
      expect(ratings.length).toEqual(2);

      expect(ratings[0].props.rating).toEqual(1);
      expect(ratings[0].props.readOnly).toEqual(true);
      expect(ratings[1].props.rating).toEqual(2);
      expect(ratings[1].props.readOnly).toEqual(true);
    });

    it('renders a review', () => {
      const root = renderToDOM({ reviews: [fakeReview] });

      const title = root.querySelector('.AddonReviewList-li h3');
      expect(title.textContent).toEqual(fakeReview.title);

      const body = root.querySelector('.AddonReviewList-li p');
      expect(body.textContent).toEqual(fakeReview.body);

      const byLine =
        root.querySelector('.AddonReviewList-by-line').textContent;
      expect(byLine).toContain(fakeReview.user.name);
    });

    it('renders an icon in the header', () => {
      const root = renderToDOM({ addon: fakeAddon });
      const img = root.querySelector('.AddonReviewList-header-icon img');
      expect(img.src).toEqual(fakeAddon.icon_url);
    });

    it('renders a hidden h1 for SEO', () => {
      const root = renderToDOM({ addon: fakeAddon });
      const h1 = root.querySelector('.AddonReviewList-header h1');
      expect(h1.className).toEqual('visually-hidden');
      expect(h1.textContent).toEqual(`Reviews for ${fakeAddon.name}`);
    });

    it('produces an addon URL', () => {
      const root = findRenderedComponentWithType(
        render(), AddonReviewListBase);
      expect(root.addonURL()).toEqual(`/addon/${fakeAddon.slug}/`);
    });

    it('produces a URL to itself', () => {
      const root = findRenderedComponentWithType(
        render(), AddonReviewListBase);
      expect(root.url()).toEqual(`/addon/${fakeAddon.slug}/reviews/`);
    });

    it('requires an addon prop to produce a URL', () => {
      const root = findRenderedComponentWithType(render({
        addon: null,
      }), AddonReviewListBase);
      expect(() => root.addonURL()).toThrowError(/cannot access addonURL/);
    });

    it('configures a paginator with the right URL', () => {
      const tree = render();
      const root = findRenderedComponentWithType(tree, AddonReviewListBase);
      const paginator = findRenderedComponentWithType(tree, Paginate);

      expect(paginator.props.pathname).toEqual(root.url());
    });

    it('configures a paginator with the right Link', () => {
      const paginator = findRenderedComponentWithType(render(), Paginate);
      expect(paginator.props.LinkComponent).toEqual(Link);
    });

    it('configures a paginator with the right review count', () => {
      const paginator = findRenderedComponentWithType(
        render({ reviewCount: 500 }), Paginate);
      expect(paginator.props.count).toEqual(500);
    });

    it('sets the paginator to page 1 without a query', () => {
      const paginator = findRenderedComponentWithType(
        // Render with an empty query string.
        render({ location: { query: {} } }), Paginate);
      expect(paginator.props.currentPage).toEqual(1);
    });

    it('sets the paginator to the query string page', () => {
      const paginator = findRenderedComponentWithType(
        render({ location: { query: { page: 3 } } }), Paginate);
      expect(paginator.props.currentPage).toEqual(3);
    });
  });

  describe('loadAddonReviews', () => {
    let mockAmoApi;

    beforeEach(() => {
      mockAmoApi = sinon.mock(amoApi);
    });

    it('loads all add-on reviews', () => {
      const addonSlug = fakeAddon.slug;
      const dispatch = sinon.stub();
      const page = 2;
      const reviews = [fakeReview];

      mockAmoApi
        .expects('getReviews')
        .once()
        .withArgs({ addon: fakeAddon.id, page })
        .returns(apiResponsePage({ results: reviews }));

      return loadAddonReviews({
        addonId: fakeAddon.id, addonSlug, dispatch, page,
      })
        .then(() => {
          mockAmoApi.verify();

          expect(dispatch.called).toBeTruthy();
          const expectedAction = setAddonReviews({
            addonSlug, reviewCount: reviews.length, reviews,
          });
          expect(dispatch.firstCall.args[0]).toEqual(expectedAction);
        });
    });

    it('ignores incomplete reviews', () => {
      const addonSlug = fakeAddon.slug;
      const dispatch = sinon.stub();
      const reviews = [fakeReview, { ...fakeReview, body: null }];

      mockAmoApi
        .expects('getReviews')
        .returns(apiResponsePage({ results: reviews }));

      return loadAddonReviews({ addonId: fakeAddon.id, addonSlug, dispatch })
        .then(() => {
          // Expect an action with a filtered review array.
          // However, the count will not take into account the filtering.
          const expectedAction = setAddonReviews({
            addonSlug, reviews: [fakeReview], reviewCount: 2,
          });
          expect(dispatch.called).toBeTruthy();
          expect(dispatch.firstCall.args[0]).toEqual(expectedAction);
        });
    });
  });

  describe('mapStateToProps', () => {
    let store;

    beforeEach(() => {
      store = createStore().store;
    });

    function getMappedProps({
      addonSlug = fakeAddon.slug, params = { addonSlug },
    } = {}) {
      return mapStateToProps(store.getState(), { params });
    }

    it('loads addon from state', () => {
      store.dispatch(loadEntities(createFetchAddonResult(fakeAddon).entities));
      const props = getMappedProps();
      expect(props.addon).toEqual(denormalizeAddon(fakeAddon));
    });

    it('ignores other add-ons', () => {
      store.dispatch(loadEntities(createFetchAddonResult(fakeAddon).entities));
      const props = getMappedProps({ addonSlug: 'other-slug' });
      expect(props.addon).toBe(undefined);
    });

    it('requires component properties', () => {
      expect(() => getMappedProps({ params: null }))
        .toThrowError(/component had a falsey params.addonSlug parameter/);
    });

    it('requires an existing slug property', () => {
      expect(() => getMappedProps({ params: {} }))
        .toThrowError(/component had a falsey params.addonSlug parameter/);
    });

    it('loads all reviews from state', () => {
      const reviews = [{ ...fakeReview, id: 1 }, { ...fakeReview, id: 2 }];
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug, reviews, reviewCount: reviews.length,
      });
      store.dispatch(action);

      const props = getMappedProps();
      expect(props.reviews).toEqual(action.payload.reviews);
    });

    it('only loads existing reviews', () => {
      const props = getMappedProps();
      expect(props.reviews).toBe(undefined);
      expect(props.reviewCount).toBe(undefined);
    });

    it('sets reviewCount prop from from state', () => {
      store.dispatch(setAddonReviews({
        addonSlug: fakeAddon.slug, reviews: [fakeReview], reviewCount: 1,
      }));

      const props = getMappedProps();
      expect(props.reviewCount).toEqual(1);
    });
  });

  describe('loadInitialData', () => {
    let mockAmoApi;
    let mockCoreApi;

    beforeEach(() => {
      mockAmoApi = sinon.mock(amoApi);
      mockCoreApi = sinon.mock(coreApi);
    });

    it('gets initial data from the API', () => {
      const { store } = createStore();
      const addonSlug = fakeAddon.slug;
      const page = 2;
      const reviews = [fakeReview];

      mockCoreApi
        .expects('fetchAddon')
        .once()
        .withArgs({ slug: addonSlug, api: { ...initialApiState } })
        .returns(Promise.resolve(createFetchAddonResult(fakeAddon)));

      mockAmoApi
        .expects('getReviews')
        .once()
        .withArgs({ addon: fakeAddon.id, page })
        .returns(apiResponsePage({ results: reviews }));

      return loadInitialData({
        location: { query: { page } }, store, params: { addonSlug },
      })
        .then(() => {
          mockAmoApi.verify();
          mockCoreApi.verify();

          const props = mapStateToProps(store.getState(),
                                        { params: { addonSlug } });
          expect(props.addon).toEqual(denormalizeAddon(fakeAddon));
          expect(props.reviews).toEqual(getLoadedReviews({ reviews }));
        });
    });

    it('requires a slug param', () => {
      const { store } = createStore();
      return loadInitialData({
        location: { query: {} }, store, params: { addonSlug: null },
      })
        .then(unexpectedSuccess, (error) => {
          expect(error.message).toMatch(/missing URL param addonSlug/);
        });
    });
  });
});
