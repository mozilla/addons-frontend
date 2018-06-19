import * as React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';

import I18nProvider from 'core/i18n/Provider';
import { SET_REVIEW } from 'amo/constants';
import { setDenormalizedReview, setReview } from 'amo/actions/reviews';
import * as reviewsApi from 'amo/api/reviews';
import * as coreUtils from 'core/utils';
import AddonReview, {
  mapDispatchToProps,
  mapStateToProps,
  AddonReviewBase,
} from 'amo/components/AddonReview';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeReview,
  signedInApiState,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import OverlayCard from 'ui/components/OverlayCard';
import UserRating from 'ui/components/UserRating';

const defaultReview = {
  addonId: fakeAddon.id,
  addonSlug: fakeAddon.slug,
  body: undefined,
  id: 3321,
  rating: 5,
};

function fakeLocalState(overrides = {}) {
  return {
    clear: () => Promise.resolve(),
    load: () => Promise.resolve(),
    save: () => Promise.resolve(),
    ...overrides,
  };
}

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const renderProps = (customProps = {}) => {
    return {
      createLocalState: () => fakeLocalState(),
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      onReviewSubmitted: () => {},
      refreshAddon: () => Promise.resolve(),
      review: defaultReview,
      store,
      updateReviewText: () => Promise.resolve(),
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = renderProps(customProps);
    return shallowUntilTarget(<AddonReview {...props} />, AddonReviewBase);
  };

  const mountRender = (customProps = {}) => {
    const props = renderProps(customProps);
    return mount(
      <I18nProvider i18n={props.i18n}>
        <Provider store={props.store}>
          <AddonReview {...props} />
        </Provider>
      </I18nProvider>,
      { context: props },
    );
  };

  it('can update a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const onReviewSubmitted = sinon.spy(() => {});
    const refreshAddon = sinon.spy(() => Promise.resolve());
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const errorHandler = createStubErrorHandler();
    const root = render({
      onReviewSubmitted,
      refreshAddon,
      updateReviewText,
      errorHandler,
    });

    root.find('.AddonReview-textarea').simulate(
      'input',
      createFakeEvent({
        target: { value: 'some review' },
      }),
    );

    const event = createFakeEvent();
    return root
      .instance()
      .onSubmit(event)
      .then(() => {
        sinon.assert.called(event.preventDefault);

        sinon.assert.calledWith(
          fakeDispatch,
          setDenormalizedReview({
            ...defaultReview,
            body: 'some review',
          }),
        );

        sinon.assert.called(updateReviewText);
        const params = updateReviewText.firstCall.args[0];
        expect(params.body).toEqual('some review');
        expect(params.addonId).toEqual(defaultReview.addonId);
        expect(params.errorHandler).toEqual(errorHandler);
        expect(params.rating).toEqual(defaultReview.rating);
        expect(params.reviewId).toEqual(defaultReview.id);

        const apiState = store.getState().api;
        // Make sure this state key exists.
        expect(apiState).toBeDefined();

        expect(params.apiState).toEqual(apiState);

        sinon.assert.called(refreshAddon);
        expect(refreshAddon.firstCall.args[0]).toEqual({
          addonSlug: defaultReview.addonSlug,
          apiState,
        });

        sinon.assert.called(onReviewSubmitted);
      });
  });

  it('focuses the review text on mount', () => {
    const root = mountRender();
    // This checks that reviewTextarea.focus() was called.
    expect(
      root.find('.AddonReview-textarea').matchesElement(document.activeElement),
    ).toEqual(true);
  });

  it('it passes onEscapeOverlay to OverlayCard', () => {
    const onEscapeOverlay = sinon.stub();
    const root = render({ onEscapeOverlay });
    expect(root.find(OverlayCard)).toHaveProp(
      'onEscapeOverlay',
      onEscapeOverlay,
    );
  });

  it('updates review state from a new review property', () => {
    const root = render();
    root.setProps({
      review: {
        ...defaultReview,
        title: 'New title',
        body: 'New body',
      },
    });
    expect(root.state('reviewBody')).toEqual('New body');
  });

  it('looks for state in a local store at initialization', () => {
    const localState = fakeLocalState({
      load: sinon.spy(() =>
        Promise.resolve({
          reviewBody: 'stored body',
        }),
      ),
    });
    render({ createLocalState: () => localState });
    sinon.assert.called(localState.load);
  });

  it('looks for state in a local store and loads it', () => {
    const localState = fakeLocalState({
      load: sinon.spy(() =>
        Promise.resolve({
          reviewBody: 'stored body',
        }),
      ),
    });
    const root = render({ createLocalState: () => localState });
    return root
      .instance()
      .checkForStoredState()
      .then(() => {
        expect(root.state('reviewBody')).toEqual('stored body');
      });
  });

  it('ignores null entries when retrieving locally stored state', () => {
    const localState = fakeLocalState({
      load: sinon.spy(() => Promise.resolve(null)),
    });
    const root = render({
      createLocalState: () => localState,
      review: {
        ...defaultReview,
        body: 'Existing body',
      },
    });
    return root
      .instance()
      .checkForStoredState()
      .then(() => {
        expect(root.state('reviewBody')).toEqual('Existing body');
      });
  });

  it('overrides existing text with locally stored text', () => {
    const localState = fakeLocalState({
      load: sinon.spy(() =>
        Promise.resolve({
          reviewBody: 'Stored text',
        }),
      ),
    });
    const root = render({
      createLocalState: () => localState,
      review: {
        ...defaultReview,
        body: 'Existing text',
      },
    });
    return root
      .instance()
      .checkForStoredState()
      .then(() => {
        expect(root.state('reviewBody')).toEqual('Stored text');
      });
  });

  it('stores text locally when you type text', () => {
    const localState = fakeLocalState({
      save: sinon.spy(() => Promise.resolve()),
    });
    const root = render({
      createLocalState: () => localState,
      debounce: (callback) => (...args) => callback(...args),
    });

    root.find('.AddonReview-textarea').simulate(
      'input',
      createFakeEvent({
        target: { value: 'some review' },
      }),
    );

    sinon.assert.called(localState.save);
    expect(localState.save.firstCall.args[0]).toEqual({
      reviewBody: 'some review',
    });
  });

  it('removes the stored state after a successful submission', () => {
    const localState = fakeLocalState({
      clear: sinon.spy(() => Promise.resolve()),
    });
    const root = render({
      createLocalState: () => localState,
    });

    root.find('.AddonReview-textarea').simulate(
      'input',
      createFakeEvent({
        target: { value: 'some review' },
      }),
    );

    return root
      .instance()
      .onSubmit(createFakeEvent())
      .then(() => {
        sinon.assert.called(localState.clear);
      });
  });

  it('prompts you appropriately when you are happy', () => {
    const root = render({ review: { ...defaultReview, rating: 4 } });
    expect(root.find('.AddonReview-prompt').html()).toMatch(
      /Tell the world why you think this extension is fantastic!/,
    );
    expect(root.find('.AddonReview-textarea').prop('placeholder')).toMatch(
      /Tell us what you love/,
    );
  });

  it('prompts you appropriately when you are unhappy', () => {
    const root = render({ review: { ...defaultReview, rating: 3 } });
    expect(root.find('.AddonReview-prompt').html()).toMatch(
      /Tell the world about this extension/,
    );
    expect(root.find('.AddonReview-textarea').prop('placeholder')).toMatch(
      /Tell us about your experience/,
    );
  });

  // Due to L10n constraints, the HTML for the link is duplicated
  // so we need to test both a high and low rating.
  [1, 5].forEach((rating) => {
    it(`rating=${rating} adds a link to the review guide`, () => {
      const root = render({ review: { ...defaultReview, rating } });
      expect(root.find('.AddonReview-prompt').html()).toMatch(
        new RegExp(
          'Please follow our <a href="/review_guide">review guidelines</a>',
        ),
      );
    });
  });

  it('allows you to edit existing review text', () => {
    const body = 'I am disappointed that it does not glow in the dark';
    const root = render({ review: { ...defaultReview, body } });
    expect(root.find('.AddonReview-textarea')).toHaveProp('value', body);
  });

  it('triggers the submit handler', () => {
    const updateReviewText = sinon.spy(() => Promise.resolve());
    const root = render({ updateReviewText });
    const onSubmit = root.find('.AddonReview-form').prop('onSubmit');
    return onSubmit(createFakeEvent()).then(() => {
      // Just make sure the submit handler is hooked up.
      sinon.assert.called(updateReviewText);
    });
  });

  it('requires a review object', () => {
    const review = { nope: 'not even close' };
    expect(() => render({ review })).toThrow(
      /Unexpected review property: {"nope".*/,
    );
  });

  it('lets you change the star rating', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const review = { ...defaultReview };
    const root = render({ review });

    const rating = root.find(UserRating);
    const onSelectRating = rating.prop('onSelectRating');
    const newRating = 1;
    onSelectRating(newRating);

    sinon.assert.calledWith(
      fakeDispatch,
      setDenormalizedReview({
        ...review,
        rating: newRating,
      }),
    );
  });

  it('preserves inputted text when you change the star rating', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const review = { ...defaultReview };
    const root = render({ review });

    const enteredReviewText = 'some text';
    root.find('.AddonReview-textarea').simulate(
      'input',
      createFakeEvent({
        target: { value: enteredReviewText },
      }),
    );

    const rating = root.find(UserRating);
    const onSelectRating = rating.prop('onSelectRating');
    const newRating = 1;
    onSelectRating(newRating);

    sinon.assert.calledWith(
      fakeDispatch,
      setDenormalizedReview({
        ...review,
        body: enteredReviewText,
        rating: newRating,
      }),
    );
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
      mockApi = sinon.mock(reviewsApi);
      dispatch = sinon.stub();
      actions = mapDispatchToProps(dispatch, {});
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

        return actions.updateReviewText({ ...params }).then(() => {
          mockApi.verify();
          sinon.assert.calledWith(dispatch, setReview(fakeReview));
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

        return actions
          .refreshAddon({ addonSlug: 'some-slug', apiState })
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

        sinon.assert.called(dispatch);
        const action = dispatch.firstCall.args[0];
        expect(action.type).toEqual(SET_REVIEW);
        expect(action.payload).toEqual(review);
      });
    });
  });
});
