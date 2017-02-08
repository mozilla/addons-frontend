import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import translate from 'core/i18n/translate';
import { setReview } from 'amo/actions/reviews';
import * as amoApi from 'amo/api';
import {
  mapDispatchToProps, mapStateToProps, AddonReviewBase,
} from 'amo/components/AddonReview';
import { ErrorHandler } from 'core/errorHandler';
import { fakeAddon, fakeReview, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

const defaultReview = {
  id: 3321, addonSlug: fakeAddon.slug, rating: 5,
};

function render({ ...customProps } = {}) {
  const props = {
    errorHandler: new ErrorHandler({
      id: 'some-id',
      dispatch: sinon.stub(),
    }),
    i18n: getFakeI18nInst(),
    apiState: signedInApiState,
    review: defaultReview,
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
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: sinon.stub(),
    });
    const root = render({ updateReviewText, errorHandler });
    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };

    const textarea = root.reviewTextarea;
    textarea.value = 'some review';
    Simulate.input(textarea);

    const overlayCard = {
      hide: sinon.stub(),
    };

    return root.onSubmit(event, { overlayCard })
      .then(() => {
        assert.ok(updateReviewText.called);
        assert.ok(event.preventDefault.called);

        const params = updateReviewText.firstCall.args[0];
        assert.equal(params.body, 'some review');
        assert.equal(params.addonSlug, defaultReview.addonSlug);
        assert.equal(params.errorHandler, errorHandler);
        assert.equal(params.reviewId, defaultReview.id);
        assert.equal(params.apiState, signedInApiState);

        // Make sure the overlay was hidden after finishing.
        assert.ok(overlayCard.hide.called);
      });
  });

  it('updates review state from a new review property', () => {
    const root = render();
    root.componentWillReceiveProps({
      review: {
        ...defaultReview,
        title: 'New title',
        body: 'New body',
      },
    });
    assert.equal(root.state.reviewBody, 'New body');
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
    Simulate.submit(root.reviewForm);

    // Just make sure the submit handler is hooked up.
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
