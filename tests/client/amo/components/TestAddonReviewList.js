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
      const store = createStore();
      const props = {
        addon: addon && denormalizeAddon(addon),
        location: { query: {} },
        params,
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
      assert.throws(() => render({ params: { addonSlug: null } }),
                    /addonSlug cannot be falsey/);
    });

    it('waits for reviews to load', () => {
      const root = renderToDOM({ reviews: null });
      assert.equal(root.textContent, 'Loading...');
    });

    it('renders a list of reviews with ratings', () => {
      const reviews = [
        { ...fakeReview, rating: 1 },
        { ...fakeReview, rating: 2 },
      ];
      const tree = render({ reviews });
      const ratings = scryRenderedComponentsWithType(tree, Rating);
      assert.equal(ratings.length, 2);

      assert.equal(ratings[0].props.rating, 1);
      assert.equal(ratings[0].props.readOnly, true);
      assert.equal(ratings[1].props.rating, 2);
      assert.equal(ratings[1].props.readOnly, true);
    });

    it('renders a review', () => {
      const root = renderToDOM({ reviews: [fakeReview] });

      const title = root.querySelector('.AddonReviewList-li h3');
      assert.equal(title.textContent, fakeReview.title);

      const body = root.querySelector('.AddonReviewList-li p');
      assert.equal(body.textContent, fakeReview.body);

      const byLine =
        root.querySelector('.AddonReviewList-by-line').textContent;
      assert.include(byLine, fakeReview.user.name);
    });

    // This test might be hard now that there are paginator links.
    it.skip('renders header links', () => {
      const tree = render({ reviews: [fakeReview] });
      const links = scryRenderedComponentsWithType(tree, Link);

      assert.equal(links.length, 2);
      const expectedDest = '/addon/chill-out/';
      links.forEach((link) => {
        assert.equal(link.props.to, expectedDest);
      });
    });

    it('renders an icon in the header', () => {
      const root = renderToDOM({ addon: fakeAddon });
      const img = root.querySelector('.AddonReviewList-header-icon img');
      assert.equal(img.src, fakeAddon.icon_url);
    });

    it('renders a hidden h1 for SEO', () => {
      const root = renderToDOM({ addon: fakeAddon });
      const h1 = root.querySelector('.AddonReviewList-header h1');
      assert.equal(h1.className, 'visually-hidden');
      assert.equal(h1.textContent, `Reviews for ${fakeAddon.name}`);
    });

    it('produces an addon URL', () => {
      const root =
        findRenderedComponentWithType(render(), AddonReviewListBase);
      assert.equal(root.addonURL(), `/addon/${fakeAddon.slug}/`);
    });

    it('requires an addon prop to produce a URL', () => {
      const root = findRenderedComponentWithType(render({
        addon: null,
      }), AddonReviewListBase);
      assert.throws(() => root.addonURL(), /cannot access addonURL/);
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

          assert.ok(dispatch.called);
          const expectedAction = setAddonReviews({
            addonSlug, reviewCount: reviews.length, reviews,
          });
          assert.deepEqual(dispatch.firstCall.args[0], expectedAction);
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
          assert.ok(dispatch.called);
          assert.deepEqual(dispatch.firstCall.args[0], expectedAction);
        });
    });
  });

  describe('mapStateToProps', () => {
    let store;

    beforeEach(() => {
      store = createStore();
    });

    function getMappedProps({
      addonSlug = fakeAddon.slug, params = { addonSlug },
    } = {}) {
      return mapStateToProps(store.getState(), { params });
    }

    it('loads addon from state', () => {
      store.dispatch(loadEntities(createFetchAddonResult(fakeAddon).entities));
      const props = getMappedProps();
      assert.deepEqual(props.addon, denormalizeAddon(fakeAddon));
    });

    it('ignores other add-ons', () => {
      store.dispatch(loadEntities(createFetchAddonResult(fakeAddon).entities));
      const props = getMappedProps({ addonSlug: 'other-slug' });
      assert.strictEqual(props.addon, undefined);
    });

    it('requires component properties', () => {
      assert.throws(() => getMappedProps({ params: null }),
                    /component had a falsey addonSlug parameter/);
    });

    it('requires an existing slug property', () => {
      assert.throws(() => getMappedProps({ params: {} }),
                    /component had a falsey addonSlug parameter/);
    });

    it('loads all reviews from state', () => {
      const reviews = [{ ...fakeReview, id: 1 }, { ...fakeReview, id: 2 }];
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug, reviews, reviewCount: reviews.length,
      });
      store.dispatch(action);

      const props = getMappedProps();
      assert.deepEqual(props.reviews, action.payload.reviews);
    });

    it('only loads existing reviews', () => {
      const props = getMappedProps();
      assert.strictEqual(props.reviews, undefined);
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
      const store = createStore();
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
          assert.deepEqual(props.addon, denormalizeAddon(fakeAddon));
          assert.deepEqual(props.reviews, getLoadedReviews({ reviews }));
        });
    });

    it('requires a slug param', () => {
      const store = createStore();
      return loadInitialData({
        location: { query: {} }, store, params: { addonSlug: null },
      })
        .then(unexpectedSuccess, (error) => {
          assert.match(error.message, /missing URL param addonSlug/);
        });
    });
  });
});
