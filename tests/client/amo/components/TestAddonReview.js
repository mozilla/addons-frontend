import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import { setReview } from 'amo/actions/reviews';
import * as amoApi from 'amo/api';
import * as coreApi from 'core/api';
import {
  mapDispatchToProps, mapStateToProps, AddonReviewBase,
  loadAddonReview as defaultAddonReviewLoader,
} from 'amo/components/AddonReview';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

const defaultReview = {
  id: 3321, addonSlug: fakeAddon.slug,
};

function render({ ...customProps } = {}) {
  const props = {
    i18n: getFakeI18nInst(),
    apiState: signedInApiState,
    review: defaultReview,
    router: {},
    updateReviewText: () => {},
    ...customProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={props.i18n}>
      <AddonReviewBase {...props} />
    </I18nProvider>
  ), AddonReviewBase);

  return findDOMNode(root);
}

describe('AddonReview', () => {
  it('can update a review', () => {
    const router = {};
    const updateReviewText = sinon.spy(() => {});
    const rootNode = render({ updateReviewText, router });

    const textarea = rootNode.querySelector('textarea');
    textarea.value = 'some review';
    Simulate.submit(rootNode.querySelector('form'));

    assert.equal(updateReviewText.called, true);
    const params = updateReviewText.firstCall.args[0];
    assert.equal(params.body, 'some review');
    assert.equal(params.addonSlug, defaultReview.addonSlug);
    assert.equal(params.reviewId, defaultReview.id);
    assert.equal(params.apiState, signedInApiState);
    assert.equal(params.router, router);
  });

  it('requires the review text to be non-empty', () => {
    const rootNode = render();
    // By default the textarea for the review is empty.
    try {
      Simulate.submit(rootNode.querySelector('form'));
      assert(false, 'unexpected success');
    } catch (error) {
      assert.match(error.message, /review .* cannot be empty/);
    }
  });

  it('requires a review object', () => {
    const review = { nope: 'not even close' };
    try {
      render({ review });
      assert(false, 'unexpected success');
    } catch (error) {
      assert.match(error.message, /Unexpected review property: {"nope".*/);
    }
  });

  describe('loadAddonReview', () => {
    let mockApi;
    let fakeDispatch;

    beforeEach(() => {
      mockApi = sinon.mock(coreApi);
      fakeDispatch = sinon.spy(() => {});
    });

    function loadAddonReview({ params } = {}) {
      let localParams = params;
      if (!localParams) {
        localParams = { slug: fakeAddon.slug, reviewId: defaultReview.id };
      }
      return defaultAddonReviewLoader(
        { store: { dispatch: fakeDispatch }, params: localParams });
    }

    it('requires URL params',
      () => loadAddonReview({ params: {} })
        .then(() => assert(false, 'unexpected success'))
        .catch((error) => {
          assert.match(error.message, /missing URL params/);
        })
    );

    it('loads a review', () => {
      const reviewResponse = {
        id: 7776,
        addon: { id: 1234 },
        version: { id: 4321 },
        rating: 2,
        user: { id: 9876 },
      };

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${fakeAddon.slug}/reviews/${defaultReview.id}`,
          method: 'GET',
        })
        .returns(Promise.resolve(reviewResponse));

      return loadAddonReview()
        .then((returnedReview) => {
          assert.equal(fakeDispatch.called, true);
          assert.deepEqual(fakeDispatch.firstCall.args[0],
                           setReview({
                             addonId: reviewResponse.addon.id,
                             versionId: reviewResponse.version.id,
                             rating: reviewResponse.rating,
                             userId: reviewResponse.user.id,
                           }));

          assert.equal(returnedReview.addonSlug, fakeAddon.slug);
          assert.equal(returnedReview.id, reviewResponse.id);

          mockApi.verify();
        });
    });
  });

  describe('mapDispatchToProps', () => {
    let mockApi;
    let fakeDispatch;
    let router;
    let props;
    const params = {
      reviewId: 3333,
      body: 'some review text',
      addonSlug: 'chill-out',
      apiState: signedInApiState,
    };

    beforeEach(() => {
      mockApi = sinon.mock(amoApi);
      router = {
        push: sinon.spy(() => {}),
      };
      fakeDispatch = sinon.spy(() => {});
      props = mapDispatchToProps(fakeDispatch);
    });

    it('allows you to submit a review', () => {
      mockApi
        .expects('submitReview')
        .withArgs(params)
        .returns(Promise.resolve({}));

      return props.updateReviewText({ router, ...params })
        .then(() => {
          mockApi.verify();
        });
    });

    it('redirects to the detail page on success', () => {
      mockApi.expects('submitReview').returns(Promise.resolve({}));

      return props.updateReviewText({ router, ...params })
        .then(() => {
          const { lang, clientApp } = signedInApiState;
          assert.equal(router.push.called, true);
          assert.equal(router.push.firstCall.args[0],
                       `/${lang}/${clientApp}/addon/chill-out/`);
        });
    });
  });

  describe('mapStateToProps', () => {
    it('maps apiState to props', () => {
      const props = mapStateToProps({ api: signedInApiState });
      assert.deepEqual(props.apiState, signedInApiState);
    });
  });
});
