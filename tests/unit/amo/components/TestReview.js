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
  mapDispatchToProps, mapStateToProps, ReviewBase,
} from 'amo/components/Review';
import { ErrorHandler } from 'core/errorHandler';
import { fakeAddon, fakeReview, signedInApiState } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';

const defaultReview = {
  id: 3321, addonId: fakeAddon.id, addonSlug: fakeAddon.slug, rating: 5,
};

function fakeLocalState(overrides = {}) {
  return {
    clear: () => Promise.resolve(),
    load: () => Promise.resolve(),
    save: () => Promise.resolve(),
    ...overrides,
  };
}

function render({ ...customProps } = {}) {
  const props = {
    createLocalState: () => fakeLocalState(),
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
  const Review = translate({ withRef: true })(ReviewBase);
  const root = findRenderedComponentWithType(renderIntoDocument(
    <Review {...props} />
  ), Review);

  return root.getWrappedInstance();
}

describe('Review', () => {
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
        expect(event.preventDefault.called).toBeTruthy();

        expect(setDenormalizedReview.called).toBeTruthy();
        expect(setDenormalizedReview.firstCall.args[0]).toEqual({ ...defaultReview, body: 'some review' });

        expect(updateReviewText.called).toBeTruthy();
        const params = updateReviewText.firstCall.args[0];
        expect(params.body).toEqual('some review');
        expect(params.addonId).toEqual(defaultReview.addonId);
        expect(params.errorHandler).toEqual(errorHandler);
        expect(params.reviewId).toEqual(defaultReview.id);
        expect(params.apiState).toEqual(signedInApiState);

        expect(refreshAddon.called).toBeTruthy();
        expect(refreshAddon.firstCall.args[0]).toEqual({
          addonSlug: defaultReview.addonSlug,
          apiState: signedInApiState,
        });

        expect(onReviewSubmitted.called).toBeTruthy();
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
    expect(root.state.reviewBody).toEqual('New body');
  });

  it('looks for state in a local store at initialization', () => {
    const store = fakeLocalState({
      load: sinon.spy(() => Promise.resolve({
        reviewBody: 'stored body',
      })),
    });
    render({ createLocalState: () => store });
    expect(store.load.called).toBeTruthy();
  });

  it('looks for state in a local store and loads it', () => {
    const store = fakeLocalState({
      load: sinon.spy(() => Promise.resolve({
        reviewBody: 'stored body',
      })),
    });
    const root = render({ createLocalState: () => store });
    return root.checkForStoredState()
      .then(() => {
        expect(root.state.reviewBody).toEqual('stored body');
      });
  });

  it('ignores null entries when retrieving locally stored state', () => {
    const store = fakeLocalState({
      load: sinon.spy(() => Promise.resolve(null)),
    });
    const root = render({
      createLocalState: () => store,
      review: {
        ...defaultReview,
        body: 'Existing body',
      },
    });
    return root.checkForStoredState()
      .then(() => {
        expect(root.state.reviewBody).toEqual('Existing body');
      });
  });

  it('overrides existing text with locally stored text', () => {
    const store = fakeLocalState({
      load: sinon.spy(() => Promise.resolve({
        reviewBody: 'Stored text',
      })),
    });
    const root = render({
      createLocalState: () => store,
      review: {
        ...defaultReview,
        body: 'Existing text',
      },
    });
    return root.checkForStoredState()
      .then(() => {
        expect(root.state.reviewBody).toEqual('Stored text');
      });
  });

  it('stores text locally when you type text', () => {
    const store = fakeLocalState({
      save: sinon.spy(() => Promise.resolve()),
    });
    const root = render({
      createLocalState: () => store,
      debounce: (callback) => (...args) => callback(...args),
    });

    const textarea = root.reviewTextarea;
    textarea.value = 'some review';
    Simulate.input(textarea);

    expect(store.save.called).toBeTruthy();
    expect(store.save.firstCall.args[0]).toEqual({
      reviewBody: 'some review',
    });
  });

  it('removes the stored state after a successful submission', () => {
    const store = fakeLocalState({
      clear: sinon.spy(() => Promise.resolve()),
    });
    const root = render({
      createLocalState: () => store,
    });

    const textarea = root.reviewTextarea;
    textarea.value = 'some review';
    Simulate.input(textarea);

    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };

    return root.onSubmit(event)
      .then(() => {
        expect(store.clear.called).toBeTruthy();
      });
  });

  it('prompts you appropriately when you are happy', () => {
    const root = render({ review: { ...defaultReview, rating: 4 } });
    expect(root.reviewPrompt.textContent).toMatch(/Tell the world why you think this extension is fantastic!/);
    expect(root.reviewTextarea.placeholder).toMatch(/Tell us what you love/);
  });

  it('prompts you appropriately when you are unhappy', () => {
    const root = render({ review: { ...defaultReview, rating: 3 } });
    expect(root.reviewPrompt.textContent).toMatch(/Tell the world about this extension./);
    expect(root.reviewTextarea.placeholder).toMatch(/Tell us about your experience/);
  });

  it('allows you to edit existing review text', () => {
    const body = 'I am disappointed that it does not glow in the dark';
    const root = render({ review: { ...defaultReview, body } });
    expect(root.reviewTextarea.textContent).toEqual(body);
  });

  it('triggers the submit handler', () => {
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const root = render({ updateReviewText });
    Simulate.submit(root.reviewForm);

    // Just make sure the submit handler is hooked up.
    expect(updateReviewText.called).toBeTruthy();
  });

  it('requires a review object', () => {
    const review = { nope: 'not even close' };
    try {
      render({ review });
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.message).toMatch(/Unexpected review property: {"nope".*/);
    }
  });

  describe('mapStateToProps', () => {
    it('maps apiState to props', () => {
      const props = mapStateToProps({ api: signedInApiState });
      expect(props.apiState).toEqual(signedInApiState);
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
            expect(dispatch.called).toBeTruthy();
            expect(dispatch.firstCall.args[0]).toEqual(setReview(fakeReview));
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

        expect(dispatch.called).toBeTruthy();
        const action = dispatch.firstCall.args[0];
        expect(action.type).toEqual(SET_REVIEW);
        expect(action.payload).toEqual(review);
      });
    });
  });
});
