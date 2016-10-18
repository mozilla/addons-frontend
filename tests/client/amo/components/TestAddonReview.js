import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import translate from 'core/i18n/translate';
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
  const AddonReview = translate({ withRef: true })(AddonReviewBase);
  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={props.i18n}>
      <AddonReview {...props} />
    </I18nProvider>
  ), AddonReview);

  return root.getWrappedInstance();
}

describe('AddonReview', () => {
  it('can update a review', () => {
    const router = { push: sinon.stub() };
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const root = render({ updateReviewText, router });
    const event = { preventDefault: sinon.stub() };

    const textarea = root.reviewTextarea;
    textarea.value = 'some review';
    return root.onSubmit(event)
      .then(() => {
        assert.ok(updateReviewText.called);
        assert.ok(event.preventDefault.called);

        const params = updateReviewText.firstCall.args[0];
        assert.equal(params.body, 'some review');
        assert.equal(params.addonSlug, defaultReview.addonSlug);
        assert.equal(params.reviewId, defaultReview.id);
        assert.equal(params.apiState, signedInApiState);

        // This just makes sure goBackToAddonDetail() is executed, which is tested
        // separately.
        assert.ok(router.push.called);
      });
  });

  it('triggers the submit handler', () => {
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const root = render({ updateReviewText });

    const textarea = root.reviewTextarea;
    textarea.value = 'some review';
    Simulate.submit(root.reviewForm);

    // Make sure the submit handler is hooked up.
    assert.ok(updateReviewText.called);
  });

  it('requires the review text to be non-empty', () => {
    const root = render();
    // By default the textarea for the review is empty.
    try {
      Simulate.submit(root.reviewForm);
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

  it('goes to the detail page when you press the back button', () => {
    const router = {
      push: sinon.stub(),
    };
    const root = render({ router });
    Simulate.click(root.backButton);
    // This just makes sure goBackToAddonDetail() is executed, which is tested
    // separately.
    assert.ok(router.push.called);
  });

  it('lets you get back to the detail page', () => {
    const { lang, clientApp } = signedInApiState;
    const router = {
      push: sinon.stub(),
    };
    const root = render({ router, apiState: signedInApiState });
    root.goBackToAddonDetail();
    assert.ok(router.push.called);
    assert.equal(router.push.firstCall.args[0],
                 `/${lang}/${clientApp}/addon/${defaultReview.addonSlug}/`);
  });

  describe('loadAddonReview', () => {
    let mockApi;
    let fakeDispatch;

    beforeEach(() => {
      mockApi = sinon.mock(coreApi);
      fakeDispatch = sinon.stub();
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
    let props;
    const params = {
      reviewId: 3333,
      body: 'some review text',
      addonSlug: 'chill-out',
      apiState: signedInApiState,
    };

    beforeEach(() => {
      mockApi = sinon.mock(amoApi);
      fakeDispatch = sinon.stub();
      props = mapDispatchToProps(fakeDispatch);
    });

    it('allows you to submit a review', () => {
      mockApi
        .expects('submitReview')
        .withArgs(params)
        .returns(Promise.resolve({}));

      return props.updateReviewText({ ...params })
        .then(() => {
          mockApi.verify();
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
