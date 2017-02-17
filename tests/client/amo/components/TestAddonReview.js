import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import translate from 'core/i18n/translate';
import { SET_REVIEW } from 'amo/constants';
import { setReview } from 'amo/actions/reviews';
import * as amoApi from 'amo/api';
import * as coreUtils from 'core/utils';
import {
  mapDispatchToProps, mapStateToProps, AddonReviewBase,
} from 'amo/components/AddonReview';
import { ErrorHandler } from 'core/errorHandler';
import { fakeAddon, fakeReview, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

const defaultReview = {
  id: 3321, addonId: fakeAddon.id, addonSlug: fakeAddon.slug, rating: 5,
};

function render({ ...customProps } = {}) {
  const props = {
    errorHandler: new ErrorHandler({
      id: 'some-id',
      dispatch: sinon.stub(),
    }),
    i18n: getFakeI18nInst(),
    apiState: signedInApiState,
    onReviewSubmitted: () => {},
    refreshAddon: () => Promise.resolve(),
    review: defaultReview,
    setDenormalizedReview: () => {},
    updateReviewText: () => Promise.resolve(),
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
    const onReviewSubmitted = sinon.spy(() => {});
    const setDenormalizedReview = sinon.spy(() => {});
    const refreshAddon = sinon.spy(() => Promise.resolve());
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: sinon.stub(),
    });
    const root = render({
      onReviewSubmitted,
      setDenormalizedReview,
      refreshAddon,
      updateReviewText,
      errorHandler,
    });
    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };

    const textarea = root.reviewTextarea;
    textarea.value = 'some review';
    Simulate.input(textarea);

    return root.onSubmit(event)
      .then(() => {
        assert.ok(event.preventDefault.called);

        assert.ok(setDenormalizedReview.called);
        assert.deepEqual(
          setDenormalizedReview.firstCall.args[0],
          { ...defaultReview, body: 'some review' },
        );

        assert.ok(updateReviewText.called);
        const params = updateReviewText.firstCall.args[0];
        assert.equal(params.body, 'some review');
        assert.equal(params.addonId, defaultReview.addonId);
        assert.equal(params.errorHandler, errorHandler);
        assert.equal(params.reviewId, defaultReview.id);
        assert.equal(params.apiState, signedInApiState);

        assert.ok(refreshAddon.called);
        assert.deepEqual(refreshAddon.firstCall.args[0], {
          addonSlug: defaultReview.addonSlug,
          apiState: signedInApiState,
        });

        assert.ok(onReviewSubmitted.called,
                  'onReviewSubmitted() should have been called after updating');
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
    let mockUtils;
    let mockApi;
    let dispatch;
    let actions;

    beforeEach(() => {
      mockUtils = sinon.mock(coreUtils);
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

    describe('refreshAddon', () => {
      it('binds dispatch and calls utils.refreshAddon()', () => {
        const apiState = signedInApiState;
        mockUtils
          .expects('refreshAddon')
          .once()
          .withArgs({ addonSlug: 'some-slug', apiState, dispatch })
          .returns(Promise.resolve());

        return actions.refreshAddon({ addonSlug: 'some-slug', apiState })
          .then(() => mockUtils.verify());
      });
    });

    describe('setDenormalizedReview', () => {
      it('dispatches a setReview action', () => {
        const review = {
          ...defaultReview,
          body: 'some body',
        };
        actions.setDenormalizedReview(review);

        assert.ok(dispatch.called);
        const action = dispatch.firstCall.args[0];
        assert.equal(action.type, SET_REVIEW);
        assert.deepEqual(action.payload, review);
      });
    });
  });
});
