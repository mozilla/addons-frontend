import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import translate from 'core/i18n/translate';
import { setJWT } from 'core/actions';
import * as amoApi from 'amo/api';
import createStore from 'amo/store';
import { setReview } from 'amo/actions/reviews';
import {
  mapDispatchToProps, mapStateToProps, OverallRatingBase,
} from 'amo/components/OverallRating';
import {
  fakeAddon, fakeReview, signedInApiState,
} from 'tests/client/amo/helpers';
import { getFakeI18nInst, userAuthToken } from 'tests/client/helpers';

function render({ ...customProps } = {}) {
  const props = {
    addonName: fakeAddon.name,
    addonSlug: fakeAddon.slug,
    addonId: fakeAddon.id,
    apiState: signedInApiState,
    version: fakeAddon.current_version,
    i18n: getFakeI18nInst(),
    userId: 91234,
    submitRating: () => {},
    loadSavedRating: () => {},
    router: {},
    ...customProps,
  };
  const OverallRating = translate({ withRef: true })(OverallRatingBase);
  const root = findRenderedComponentWithType(renderIntoDocument(
    <OverallRating {...props} />
  ), OverallRating);

  return root.getWrappedInstance();
}

describe('OverallRating', () => {
  function selectRating(root, ratingNumber) {
    const button = root.ratingButtons[ratingNumber];
    assert.ok(button, `No button returned for rating: ${ratingNumber}`);
    Simulate.click(button);
  }

  it('prompts you to rate the add-on by name', () => {
    const root = render({ addonName: 'Some Add-on' });
    assert.include(root.ratingLegend.textContent, 'Some Add-on');
  });

  it('loads saved ratings on construction', () => {
    const userId = 12889;
    const addonId = 3344;
    const version = {
      ...fakeAddon.current_version,
      id: 9966,
    };
    const loadSavedRating = sinon.spy();

    render({ userId, addonId, version, loadSavedRating });

    assert.equal(loadSavedRating.called, true);
    const args = loadSavedRating.firstCall.args[0];
    assert.deepEqual(args, { userId, addonId });
  });

  it('does not load saved ratings when userId is empty', () => {
    const userId = null;
    const loadSavedRating = sinon.spy();

    render({ userId, loadSavedRating });
    assert.equal(loadSavedRating.called, false);
  });

  it('creates a rating with add-on and version info', () => {
    const router = {};
    const submitRating = sinon.stub();
    const root = render({
      submitRating,
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: 321 },
      addonId: 12345,
      userId: 92345,
      router,
    });
    selectRating(root, 5);
    assert.equal(submitRating.called, true);

    const call = submitRating.firstCall.args[0];
    assert.equal(call.versionId, 321);
    assert.equal(call.apiState.token, 'new-token');
    assert.equal(call.addonId, 12345);
    assert.equal(call.addonSlug, 'chill-out');
    assert.equal(call.userId, 92345);
    assert.equal(call.router, router);
    assert.strictEqual(call.reviewId, undefined);
  });

  it('updates a rating with the review ID', () => {
    const submitRating = sinon.stub();
    const root = render({
      submitRating,
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: 321 },
      addonId: 12345,
      userId: 92345,
      userReview: fakeReview,
    });
    selectRating(root, 5);
    assert.equal(submitRating.called, true);

    const call = submitRating.firstCall.args[0];
    assert.equal(call.reviewId, fakeReview.id);
  });

  it('lets you submit a one star rating', () => {
    const submitRating = sinon.stub();
    const root = render({ submitRating });
    selectRating(root, 1);
    assert.equal(submitRating.called, true);
    assert.equal(submitRating.firstCall.args[0].rating, 1);
  });

  it('lets you submit a two star rating', () => {
    const submitRating = sinon.stub();
    const root = render({ submitRating });
    selectRating(root, 2);
    assert.equal(submitRating.called, true);
    assert.equal(submitRating.firstCall.args[0].rating, 2);
  });

  it('lets you submit a three star rating', () => {
    const submitRating = sinon.stub();
    const root = render({ submitRating });
    selectRating(root, 3);
    assert.equal(submitRating.called, true);
    assert.equal(submitRating.firstCall.args[0].rating, 3);
  });

  it('lets you submit a four star rating', () => {
    const submitRating = sinon.stub();
    const root = render({ submitRating });
    selectRating(root, 4);
    assert.equal(submitRating.called, true);
    assert.equal(submitRating.firstCall.args[0].rating, 4);
  });

  it('lets you submit a five star rating', () => {
    const submitRating = sinon.stub();
    const root = render({ submitRating });
    selectRating(root, 5);
    assert.equal(submitRating.called, true);
    assert.equal(submitRating.firstCall.args[0].rating, 5);
  });

  it('renders selected stars corresponding to a saved review', () => {
    const root = render({
      userReview: {
        ...fakeReview,
        rating: 3,
      },
    });

    // Make sure only the first 3 stars are selected.
    [1, 2, 3].forEach((rating) => {
      assert.equal(root.ratingButtons[rating].className,
                   'OverallRating-choice OverallRating-selected-star');
    });
    [4, 5].forEach((rating) => {
      assert.equal(root.ratingButtons[rating].className,
                   'OverallRating-choice');
    });
  });

  it('renders all stars as selectable by default', () => {
    const root = render();
    [1, 2, 3, 4, 5].forEach((rating) => {
      const button = root.ratingButtons[rating];
      assert.equal(button.className, 'OverallRating-choice');
      assert.equal(button.disabled, false);
    });
  });

  it('prevents form submission when selecting a rating', () => {
    const root = render();

    const fakeEvent = {
      preventDefault: sinon.stub(),
      currentTarget: {},
    };
    const button = root.ratingButtons[4];
    Simulate.click(button, fakeEvent);

    assert.equal(fakeEvent.preventDefault.called, true);
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

    describe('submitRating', () => {
      it('posts the rating and dispatches the created rating', () => {
        const router = { push: sinon.spy(() => {}) };
        const params = {
          rating: fakeReview.rating,
          apiState: { ...signedInApiState, token: 'new-token' },
          addonSlug: fakeAddon.slug,
          versionId: fakeReview.version.id,
        };

        mockApi
          .expects('submitReview')
          .withArgs(params)
          .returns(Promise.resolve({ ...fakeReview, ...params }));

        return actions.submitRating({ ...params, router })
          .then(() => {
            assert.equal(dispatch.called, true);
            const action = dispatch.firstCall.args[0];
            assert.deepEqual(action, setReview(fakeReview));

            assert.equal(router.push.called, true);
            const { lang, clientApp } = signedInApiState;
            const reviewId = fakeReview.id;
            assert.equal(
              router.push.firstCall.args[0],
              `/${lang}/${clientApp}/addon/${params.addonSlug}/review/${reviewId}/`);

            mockApi.verify();
          });
      });
    });

    describe('loadSavedRating', () => {
      function loadSavedRating({
        userId = 123,
        addonId = fakeAddon.id,
      } = {}) {
        return actions.loadSavedRating({ userId, addonId });
      }

      it('finds and dispatches a review', () => {
        mockApi
          .expects('getUserReviews')
          .withArgs({
            userId: fakeReview.user.id,
            addonId: fakeReview.addon.id,
            onlyTheLatest: true,
          })
          .returns(Promise.resolve(fakeReview));

        return loadSavedRating({ userId: fakeReview.user.id })
          .then(() => {
            mockApi.verify();
            assert.equal(dispatch.called, true);
            assert.deepEqual(dispatch.firstCall.args[0], setReview(fakeReview));
          });
      });

      it('does nothing when there are not any matching reviews', () => {
        const addonId = 8765;
        mockApi.expects('getUserReviews').returns(Promise.resolve(null));

        return loadSavedRating({ addonId })
          .then(() => {
            assert.equal(dispatch.called, false);
          });
      });
    });
  });

  describe('mapStateToProps', () => {
    let store;

    beforeEach(() => {
      store = createStore();
    });

    function getMappedProps({
      state = store.getState(),
      componentProps = {
        addonId: fakeAddon.id,
        version: fakeAddon.current_version,
      },
    } = {}) {
      return mapStateToProps(state, componentProps);
    }

    function signIn({ userId = 98765 } = {}) {
      store.dispatch(setJWT(userAuthToken({
        user_id: userId,
      })));
    }

    it('copies api state to props', () => {
      signIn();

      const state = store.getState();
      assert(state.api.token, 'a valid token exists in state');

      const props = getMappedProps();
      assert.deepEqual(props.apiState, state.api);
    });

    it('sets an empty apiState when not signed in', () => {
      assert.deepEqual(getMappedProps().apiState, {});
    });

    it('sets an empty userId when not signed in', () => {
      assert.equal(getMappedProps().userId, undefined);
    });

    it('sets the userId property from the state', () => {
      const userId = 91234;
      signIn({ userId });
      assert.equal(getMappedProps().userId, userId);
    });

    it('sets an empty user review when no reviews are in state', () => {
      signIn();
      assert.strictEqual(getMappedProps().userReview, undefined);
    });

    it('sets a user review to the latest matching one in state', () => {
      const isLatest = true;
      signIn({ userId: fakeReview.user.id });

      store.dispatch(setReview(fakeReview, { isLatest }));

      const userReview = getMappedProps().userReview;
      assert.deepEqual(userReview, {
        id: fakeReview.id,
        versionId: fakeReview.version.id,
        rating: fakeReview.rating,
        isLatest,
      });
    });

    it('ignores reviews from other users', () => {
      const userIdOne = 1;
      const userIdTwo = 2;
      const savedRating = 5;

      signIn({ userId: userIdOne });

      // Save a review for user two.
      store.dispatch(setReview(fakeReview, {
        isLatest: true,
        userId: userIdTwo,
        rating: savedRating,
      }));

      assert.strictEqual(getMappedProps().userReview, undefined);
    });

    it('ignores reviews for another add-on', () => {
      signIn({ userId: fakeReview.user.id });

      store.dispatch(setReview(fakeReview, {
        isLatest: true,
        addonId: 554433, // this is a review for an unrelated add-on
      }));

      assert.strictEqual(getMappedProps().userReview, undefined);
    });

    it('only finds the latest review for an add-on', () => {
      signIn({ userId: fakeReview.user.id });

      const reviewBase = {
        versionId: fakeReview.version.id,
        rating: 5,
      };

      const oldReview = {
        ...reviewBase,
        id: 1,
        isLatest: false,
      };

      const latestReview = {
        ...reviewBase,
        id: 2,
        isLatest: true,
      };

      store.dispatch(setReview(fakeReview, oldReview));
      store.dispatch(setReview(fakeReview, latestReview));

      assert.deepEqual(getMappedProps().userReview, latestReview);
    });
  });
});
