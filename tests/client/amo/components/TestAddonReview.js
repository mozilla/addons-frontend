import React from 'react';
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
import { fakeAddon, fakeReview, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

const defaultReview = {
  id: 3321, addonSlug: fakeAddon.slug, rating: 5,
};

function render({ ...customProps } = {}) {
  const props = {
    errorHandler: sinon.stub(),
    i18n: getFakeI18nInst(),
    apiState: signedInApiState,
    review: defaultReview,
    router: {},
    updateReviewText: () => {},
    ...customProps,
  };
  const AddonReview = translate({ withRef: true })(AddonReviewBase);
  const root = findRenderedComponentWithType(renderIntoDocument(
    <AddonReview {...props} />
  ), AddonReview);

  return root.getWrappedInstance();
}

describe('AddonReview', () => {
  it('can update a review', () => {
    const router = { push: sinon.stub() };
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const errorHandler = sinon.stub();
    const root = render({ updateReviewText, router, errorHandler });
    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };

    const textarea = root.reviewTextarea;
    textarea.value = 'some review';
    return root.onSubmit(event)
      .then(() => {
        assert.ok(updateReviewText.called);
        assert.ok(event.preventDefault.called);

        const params = updateReviewText.firstCall.args[0];
        assert.equal(params.body, 'some review');
        assert.equal(params.addonSlug, defaultReview.addonSlug);
        assert.equal(params.errorHandler, errorHandler);
        assert.equal(params.reviewId, defaultReview.id);
        assert.equal(params.apiState, signedInApiState);

        // This just makes sure goBackToAddonDetail() is executed, which is tested
        // separately.
        assert.ok(router.push.called);
      });
  });

  it('prompts you appropriately when you are happy', () => {
    const root = render({ review: { ...defaultReview, rating: 4 } });
    assert.match(root.reviewPrompt.textContent,
                 /Tell the world why you think this extension is fantastic!/);
    assert.match(root.reviewTextarea.placeholder,
                 /Tell us what you love/);
  });

  it('prompts you appropriately when you are unhappy', () => {
    const root = render({ review: { ...defaultReview, rating: 3 } });
    assert.match(root.reviewPrompt.textContent,
                 /Tell the world about this extension./);
    assert.match(root.reviewTextarea.placeholder,
                 /Tell us about your experience/);
  });

  it('allows you to edit existing review text', () => {
    const body = 'I am disappointed that it does not glow in the dark';
    const root = render({ review: { ...defaultReview, body } });
    assert.equal(root.reviewTextarea.textContent, body);
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
        .then(() => assert(false, 'unexpected success'), (error) => {
          assert.match(error.message, /missing URL params/);
        })
    );

    it('loads a review', () => {
      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: `addons/addon/${fakeAddon.slug}/reviews/${defaultReview.id}`,
          method: 'GET',
        })
        .returns(Promise.resolve(fakeReview));

      return loadAddonReview()
        .then((returnedReview) => {
          assert.equal(fakeDispatch.called, true);
          assert.deepEqual(fakeDispatch.firstCall.args[0],
                           setReview(fakeReview));

          assert.equal(returnedReview.addonSlug, fakeAddon.slug);
          assert.equal(returnedReview.rating, fakeReview.rating);
          assert.equal(returnedReview.id, fakeReview.id);
          assert.equal(returnedReview.body, fakeReview.body);

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

  describe('mapDispatchToProps', () => {
    let mockApi;
    let dispatch;
    let actions;

    beforeEach(() => {
      mockApi = sinon.mock(amoApi);
      dispatch = sinon.stub();
      actions = mapDispatchToProps(dispatch);
    });

    describe('updateReviewText', () => {
      it('allows you to update a review', () => {
        const params = {
          reviewId: 3333,
          body: 'some review text',
          addonSlug: 'chill-out',
          apiState: signedInApiState,
        };

        mockApi
          .expects('submitReview')
          .withArgs(params)
          .returns(Promise.resolve(fakeReview));

        return actions.updateReviewText({ ...params })
          .then(() => {
            mockApi.verify();
            assert.ok(dispatch.called, 'the new review should be dispatched');
            assert.deepEqual(dispatch.firstCall.args[0], setReview(fakeReview));
          });
      });
    });
  });
});
