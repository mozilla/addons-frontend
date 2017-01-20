import React from 'react';
import {
  renderIntoDocument,
  scryRenderedComponentsWithType,
} from 'react-addons-test-utils';
import { normalize } from 'normalizr';
import { Provider } from 'react-redux';
import { findDOMNode } from 'react-dom';

import createStore from 'amo/store';
import translate from 'core/i18n/translate';
import * as amoApi from 'amo/api';
import * as coreApi from 'core/api';
import { setAddonReviews } from 'amo/actions/reviews';
import {
  AddonReviewListBase,
  loadAddonReviews,
  loadInitialData,
  mapStateToProps,
} from 'amo/components/AddonReviewList';
import Link from 'amo/components/Link';
import { denormalizeAddon } from 'core/reducers/addons';
import { loadAddonIfNeeded } from 'core/utils';
import Rating from 'ui/components/Rating';
import { fakeAddon, fakeReview } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

function getLoadedReviews({
  addonSlug = fakeAddon.slug, reviews = [fakeReview] } = {},
) {
  const action = setAddonReviews({ addonSlug, reviews });
  // This is how reviews look after they have been loaded.
  return action.payload.reviews;
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
      const store = createStore();
      const props = {
        addon: denormalizeAddon(addon),
        params,
        i18n: getFakeI18nInst(),
        initialData: {
          reviews: getLoadedReviews({ reviews }),
        },
        ...customProps,
      };

      const AddonReviewList = translate({ withRef: true })(AddonReviewListBase);
      const tree = renderIntoDocument(
        <Provider store={store}>
          <AddonReviewList {...props} />
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

    it('waits for initial data to load', () => {
      const root = renderToDOM({ initialData: null });
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

    it('renders header links', () => {
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
  });

  describe('loadAddonReviews', () => {
    let mockAmoApi;

    beforeEach(() => {
      mockAmoApi = sinon.mock(amoApi);
    });

    it('loads all add-on reviews', () => {
      const addonSlug = fakeAddon.slug;
      const dispatch = sinon.stub();
      const reviews = [fakeReview];

      mockAmoApi
        .expects('getAddonReviews')
        .once()
        .withArgs({ addonSlug })
        .returns(Promise.resolve(reviews));

      return loadAddonReviews({ addonSlug, dispatch })
        .then((loadedReviews) => {
          mockAmoApi.verify();

          const expectedAction = setAddonReviews({ addonSlug, reviews });
          assert.deepEqual(loadedReviews, expectedAction.payload.reviews);
          assert.ok(dispatch.called);
          assert.deepEqual(dispatch.firstCall.args[0], expectedAction);
        });
    });

    it('ignores incomplete reviews', () => {
      const addonSlug = fakeAddon.slug;
      const dispatch = sinon.stub();
      const reviews = [fakeReview, { ...fakeReview, body: null }];

      mockAmoApi
        .expects('getAddonReviews')
        .returns(Promise.resolve(reviews));

      return loadAddonReviews({ addonSlug, dispatch })
        .then((loadedReviews) => {
          const expectedAction = setAddonReviews({
            addonSlug, reviews: [fakeReview],
          });
          assert.deepEqual(loadedReviews, expectedAction.payload.reviews);
          assert.ok(dispatch.called);
          assert.deepEqual(dispatch.firstCall.args[0], expectedAction);
        });
    });
  });

  describe('mapStateToProps', () => {
    let store;
    let mockCoreApi;

    beforeEach(() => {
      store = createStore();
      mockCoreApi = sinon.mock(coreApi);
    });

    it('loads addon from state', () => {
      const addonSlug = fakeAddon.slug;

      mockCoreApi
        .expects('fetchAddon')
        .once()
        .withArgs({ slug: addonSlug, api: {} })
        // Simulate how callApi() applies the add-on schema to
        // the API server response.
        .returns(Promise.resolve(normalize(fakeAddon, coreApi.addon)));

      // Dispatch add-on entities.
      return loadAddonIfNeeded({ store, params: { slug: addonSlug }})
        .then(() => {
          mockCoreApi.verify();
          const props = mapStateToProps(store.getState(),
                                        { params: { addonSlug } });
          assert.deepEqual(props.addon, denormalizeAddon(fakeAddon));
        });
    });

    it('requires component properties', () => {
      assert.throws(() => mapStateToProps(store.getState()),
                    /component had a falsey addonSlug parameter/);
    });

    it('requires an existing slug property', () => {
      assert.throws(() => mapStateToProps(store.getState(), {}),
                    /component had a falsey addonSlug parameter/);
    });
  });

  describe('loadInitialData', () => {
    let mockCoreApi;

    beforeEach(() => {
      mockCoreApi = sinon.mock(coreApi);
    });

    it('gets initial data from the API', () => {
      const store = createStore();
      const addonSlug = fakeAddon.slug;
      const loadedReviews = getLoadedReviews();
      const _loadAddonReviews = sinon.spy(
        () => Promise.resolve(loadedReviews));

      mockCoreApi
        .expects('fetchAddon')
        .once()
        .withArgs({ slug: addonSlug, api: {} })
        // Simulate how callApi() applies the add-on schema to
        // the API server response.
        .returns(Promise.resolve(normalize(fakeAddon, coreApi.addon)));

      return loadInitialData({ store, params: { addonSlug } },
                             { _loadAddonReviews })
        .then((initialData) => {
          mockCoreApi.verify();

          // Make sure the add-on was loaded into state.
          const props = mapStateToProps(store.getState(),
                                        { params: { addonSlug } });
          assert.deepEqual(props.addon, denormalizeAddon(fakeAddon));

          assert.deepEqual(initialData.reviews, loadedReviews);
        });
    });

    it('requires a slug param', () => {
      const store = createStore();
      return loadInitialData({ store, params: { addonSlug: null } })
        .then(() => assert(false, 'Unexpected success'), (error) => {
          assert.match(error.message, /missing URL param addonSlug/);
        });
    });
  });
});
