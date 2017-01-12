import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import createStore from 'amo/store';
import translate from 'core/i18n/translate';
import * as amoApi from 'amo/api';
import * as coreApi from 'core/api';
import { setAddonReviews } from 'amo/actions/reviews';
import {
  loadAddonReviews,
  loadInitialData,
} from 'amo/components/AddonReviewList';
import {
  fakeAddon,
  fakeReview,
  signedInApiState,
} from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

describe('amo/components/AddonReviewList', () => {
  describe('loadAddonReviews', () => {
    let mockAmoApi;
    let mockCoreApi;

    beforeEach(() => {
      mockAmoApi = sinon.mock(amoApi);
      mockCoreApi = sinon.mock(coreApi);
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
    let mockAmoApi;
    let mockCoreApi;

    beforeEach(() => {
      mockAmoApi = sinon.mock(amoApi);
      mockCoreApi = sinon.mock(coreApi);
    });

    it.skip('gets initial data from the API', () => {
      const slug = fakeAddon.slug;
      const store = createStore();
      sinon.stub(store, 'dispatch');

      const entities = { [slug]: fakeAddon };
      mockCoreApi
        .expects('fetchAddon')
        .once()
        .withArgs({ slug, api: {} })
        .returns(Promise.resolve({ entities }));
      mockAmoApi
        .expects('getAddonReviews')
        .once()
        .withArgs({ addonSlug: slug })
        .returns(Promise.resolve([fakeReview]));

      return loadInitialData({ store, params: { slug } })
        .then((initialData) => {
          mockCoreApi.verify();
          mockAmoApi.verify();

          assert.deepEqual(initialData.reviews, [fakeReview]);
        });
    });
  });
});
