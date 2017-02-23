import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';

import translate from 'core/i18n/translate';
import { setJwt } from 'core/actions';
import I18nProvider from 'core/i18n/Provider';
import * as amoApi from 'amo/api';
import createStore from 'amo/store';
import { setReview } from 'amo/actions/reviews';
import {
  mapDispatchToProps, mapStateToProps, RatingManagerBase,
} from 'amo/components/RatingManager';
import {
  fakeAddon, fakeReview, signedInApiState,
} from 'tests/client/amo/helpers';
import { getFakeI18nInst, userAuthToken } from 'tests/client/helpers';

function render(customProps = {}) {
  const props = {
    AddonReview: () => <div />,
    addon: fakeAddon,
    apiState: signedInApiState,
    errorHandler: sinon.stub(),
    version: fakeAddon.current_version,
    userId: 91234,
    submitReview: () => Promise.resolve(),
    loadSavedReview: () => Promise.resolve(),
    ...customProps,
  };
  const RatingManager = translate({ withRef: true })(RatingManagerBase);
  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <RatingManager {...props} />
    </I18nProvider>
  ), RatingManager);

  return root.getWrappedInstance();
}

describe('RatingManager', () => {
  it('prompts you to rate the add-on by name', () => {
    const root = render({ addon: { ...fakeAddon, name: 'Some Add-on' } });
    assert.include(root.ratingLegend.textContent, 'Some Add-on');
  });

  it('loads saved ratings on construction', () => {
    const userId = 12889;
    const addon = { ...fakeAddon, id: 3344 };
    const version = {
      ...fakeAddon.current_version,
      id: 9966,
    };
    const loadSavedReview = sinon.spy();

    render({ userId, addon, version, loadSavedReview });

    assert.equal(loadSavedReview.called, true);
    const args = loadSavedReview.firstCall.args[0];
    assert.deepEqual(args, { userId, addonId: addon.id });
  });

  it('does not load saved ratings when userId is empty', () => {
    const userId = null;
    const loadSavedReview = sinon.spy();

    render({ userId, loadSavedReview });
    assert.equal(loadSavedReview.called, false);
  });

  it('creates a rating with add-on and version info', () => {
    const errorHandler = sinon.stub();
    const submitReview = sinon.spy(() => Promise.resolve());
    const root = render({
      errorHandler,
      submitReview,
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: 321 },
      addon: { ...fakeAddon, id: 12345, slug: 'some-slug' },
      userId: 92345,
    });
    return root.onSelectRating(5)
      .then(() => {
        assert.equal(submitReview.called, true);

        const call = submitReview.firstCall.args[0];
        assert.equal(call.versionId, 321);
        assert.equal(call.apiState.token, 'new-token');
        assert.equal(call.addonId, 12345);
        assert.equal(call.errorHandler, errorHandler);
        assert.equal(call.userId, 92345);
        assert.strictEqual(call.reviewId, undefined);
      });
  });

  it('updates a rating with the review ID', () => {
    const submitReview = sinon.spy(() => Promise.resolve());
    const root = render({
      submitReview,
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: fakeReview.version.id },
      userId: 92345,
      userReview: setReview(fakeReview).payload,
    });
    return root.onSelectRating(5)
      .then(() => {
        assert.ok(submitReview.called);

        const call = submitReview.firstCall.args[0];
        assert.ok(call.reviewId);
        assert.equal(call.reviewId, fakeReview.id);
        assert.equal(call.versionId, fakeReview.version.id);
      });
  });

  it('does not update an existing review if its version does not match', () => {
    const submitReview = sinon.spy(() => Promise.resolve());

    // Set up a situation where the user is viewing a new version
    // but their latest saved review is for an older version.
    const oldVersionId = 1;
    const newReview = {
      ...fakeReview,
      version: {
        ...fakeReview.version,
        id: 2,
      },
    };
    const addon = { ...fakeAddon, id: newReview.addon.id };

    const root = render({
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: oldVersionId },
      userId: 92345,
      userReview: setReview(newReview).payload,
      submitReview,
      addon,
    });
    return root.onSelectRating(newReview.rating)
      .then(() => {
        assert.ok(submitReview.called);

        // Make sure the review is submitted in a way where it will be
        // newly created against the current version.
        const call = submitReview.firstCall.args[0];
        assert.equal(call.reviewId, undefined);
        assert.equal(call.versionId, addon.current_version.id);
        assert.equal(call.rating, newReview.rating);
        assert.equal(call.addonId, newReview.addon.id);
      });
  });

  it('renders and configures AddonReview after submitting a rating', () => {
    const userReview = setReview(fakeReview).payload;
    const FakeAddonReview = sinon.spy(() => <div />);
    const root = render({ AddonReview: FakeAddonReview, userReview });

    assert.equal(FakeAddonReview.called, false,
      'expected AddonReview to initially not be visible');

    return root.onSelectRating(5)
      .then(() => {
        assert.ok(FakeAddonReview.called,
          'expected AddonReview to be visible after submiting a rating');

        const props = FakeAddonReview.firstCall.args[0];
        assert.deepEqual(props.review, userReview);

        // Now make sure the callback is configured.
        assert.equal(root.state.showTextEntry, true,
          'expected state to indicate that AddonReview is visible');
        // Trigger the callback just like AddonReview would after completion.
        props.onReviewSubmitted();
        assert.equal(root.state.showTextEntry, false,
          'expected state to indicate that AddonReview is hidden');
      });
  });

  it('configures a rating component', () => {
    const userReview = setReview(fakeReview).payload;
    const RatingStub = sinon.spy(() => (<div />));

    const root = render({ Rating: RatingStub, userReview });

    assert.equal(RatingStub.called, true);
    const props = RatingStub.firstCall.args[0];
    assert.equal(props.onSelectRating, root.onSelectRating);
    assert.equal(props.rating, userReview.rating);
  });

  it('sets a blank rating when there is no saved review', () => {
    const RatingStub = sinon.spy(() => (<div />));

    render({ Rating: RatingStub, userReview: null });

    assert.equal(RatingStub.called, true);
    const props = RatingStub.firstCall.args[0];
    assert.strictEqual(props.rating, undefined);
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

    describe('submitReview', () => {
      it('posts the reviw and dispatches the created review', () => {
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

        return actions.submitReview(params)
          .then(() => {
            assert.equal(dispatch.called, true);
            const action = dispatch.firstCall.args[0];
            assert.deepEqual(action, setReview(fakeReview));
            mockApi.verify();
          });
      });
    });

    describe('loadSavedReview', () => {
      it('finds and dispatches a review', () => {
        const userId = fakeReview.user.id;
        const addonId = fakeReview.addon.id;
        mockApi
          .expects('getLatestUserReview')
          .withArgs({ user: userId, addon: addonId })
          .returns(Promise.resolve(fakeReview));

        return actions.loadSavedReview({ userId, addonId })
          .then(() => {
            mockApi.verify();
            assert.equal(dispatch.called, true);
            assert.deepEqual(dispatch.firstCall.args[0], setReview(fakeReview));
          });
      });

      it('does nothing when there are not any matching reviews', () => {
        const addonId = 8765;
        mockApi.expects('getLatestUserReview').returns(Promise.resolve(null));

        return actions.loadSavedReview({ userId: 123, addonId })
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
        addon: fakeAddon,
        version: fakeAddon.current_version,
      },
    } = {}) {
      return mapStateToProps(state, componentProps);
    }

    function signIn({ userId = 98765 } = {}) {
      store.dispatch(setJwt(userAuthToken({
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
      signIn({ userId: fakeReview.user.id });

      const action = setReview(fakeReview, { isLatest: true });
      store.dispatch(action);
      const dispatchedReview = action.payload;

      const userReview = getMappedProps().userReview;
      assert.deepEqual(userReview, dispatchedReview);
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

      function createReview(overrides) {
        const action = setReview(fakeReview, overrides);
        store.dispatch(action);
        return action.payload;
      }

      createReview({
        id: 1,
        isLatest: false,
      });
      const latestReview = createReview({
        id: 2,
        isLatest: true,
      });

      assert.deepEqual(getMappedProps().userReview, latestReview);
    });
  });
});
