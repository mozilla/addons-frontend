import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  scryRenderedComponentsWithType,
  Simulate,
} from 'react-addons-test-utils';
import { normalize } from 'normalizr';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import translate from 'core/i18n/translate';
import * as amoApi from 'amo/api';
import * as coreApi from 'core/api';
import { setAddonReviews } from 'amo/actions/reviews';
import {
  AddonReviewListBase,
  loadAddonReviews,
  loadInitialData,
} from 'amo/components/AddonReviewList';
import Rating from 'ui/components/Rating';
import {
  fakeAddon,
  fakeReview,
  signedInApiState,
} from 'tests/client/amo/helpers';
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
    function render({ ...customProps } = {}) {
      const store = createStore();
      const props = {
        i18n: getFakeI18nInst(),
        initialData: {
          addon: fakeAddon,
          reviews: getLoadedReviews(),
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

    it('lists reviews', () => {
      const tree = render();
      const ratings = scryRenderedComponentsWithType(tree, Rating);
      assert.equal(ratings.length, 1);
      assert.equal(ratings.props.rating, fakeReview.rating);
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
  });

  describe('loadInitialData', () => {
    let mockCoreApi;

    beforeEach(() => {
      mockCoreApi = sinon.mock(coreApi);
    });

    it('gets initial data from the API', () => {
      const store = createStore();
      const slug = fakeAddon.slug;
      const loadedReviews = getLoadedReviews();
      const _loadAddonReviews = sinon.spy(
        () => Promise.resolve(loadedReviews));

      mockCoreApi
        .expects('fetchAddon')
        .once()
        .withArgs({ slug, api: {} })
        // Simulate how callApi() applies the add-on schema to
        // the API server response.
        .returns(Promise.resolve(normalize(fakeAddon, coreApi.addon)));

      return loadInitialData({ store, params: { slug } },
                             { _loadAddonReviews })
        .then((initialData) => {
          mockCoreApi.verify();
          assert.deepEqual(initialData.addon, fakeAddon);
          assert.deepEqual(initialData.reviews, loadedReviews);
        });
    });

    it('requires a slug param', () => {
      const store = createStore();
      return loadInitialData({ store, params: { slug: null } })
        .then(() => {
          throw new Error('unexpected success');
        })
        .catch((error) => {
          assert.match(error.message, /missing URL param slug/);
        });
    });
  });
});
