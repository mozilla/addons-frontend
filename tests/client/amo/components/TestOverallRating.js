import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import { setJWT } from 'core/actions';
import * as amoApi from 'amo/api';
import createStore from 'amo/store';
import { setReview } from 'amo/actions/reviews';
import {
  mapDispatchToProps, mapStateToProps, OverallRatingBase,
} from 'amo/components/OverallRating';
import { SET_REVIEW } from 'amo/constants';
import {
  createRatingResponse, fakeAddon, signedInApiState,
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
    createRating: () => {},
    loadSavedRating: () => {},
    router: {},
    ...customProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <OverallRatingBase {...props} />
  ), OverallRatingBase);

  return findDOMNode(root);
}

describe('OverallRating', () => {
  function selectRating(root, selector) {
    const button = root.querySelector(selector);
    assert.ok(button, `No button returned for selector: ${selector}`);
    Simulate.click(button);
  }

  it('prompts you to rate the add-on by name', () => {
    const rootNode = render({ addonName: 'Some Add-on' });
    assert.include(rootNode.querySelector('legend').textContent,
                   'Some Add-on');
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
    assert.equal(args.userId, userId);
    assert.equal(args.addonId, addonId);
    assert.equal(args.versionId, version.id);
  });

  it('does not load saved ratings when userId is empty', () => {
    const userId = null;
    const loadSavedRating = sinon.spy();

    render({ userId, loadSavedRating });
    assert.equal(loadSavedRating.called, false);
  });

  it('creates a rating with add-on and version info', () => {
    const router = {};
    const createRating = sinon.stub();
    const root = render({
      createRating,
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: 321 },
      addonId: 12345,
      userId: 92345,
      router,
    });
    selectRating(root, '#OverallRating-rating-5');
    assert.equal(createRating.called, true);

    const call = createRating.firstCall.args[0];
    assert.equal(call.versionId, 321);
    assert.equal(call.apiState.token, 'new-token');
    assert.equal(call.addonId, 12345);
    assert.equal(call.addonSlug, 'chill-out');
    assert.equal(call.userId, 92345);
    assert.equal(call.router, router);
  });

  it('lets you submit a one star rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-rating-1');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 1);
  });

  it('lets you submit a two star rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-rating-2');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 2);
  });

  it('lets you submit a three star rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-rating-3');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 3);
  });

  it('lets you submit a four star rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-rating-4');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 4);
  });

  it('lets you submit a five star rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-rating-5');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 5);
  });

  it('prevents form submission when selecting a rating', () => {
    const root = render();

    const fakeEvent = {
      preventDefault: sinon.stub(),
      currentTarget: {},
    };
    const button = root.querySelector('#OverallRating-rating-5');
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

    describe('createRating', () => {
      it('posts the rating and dispatches the created rating', () => {
        const router = { push: sinon.spy(() => {}) };
        const userId = 91234;
        const addonId = 123455;
        const params = {
          rating: 5,
          apiState: { ...signedInApiState, token: 'new-token' },
          addonSlug: 'chill-out',
          versionId: 321,
        };

        const ratingResponse = createRatingResponse({
          rating: params.rating,
        });

        mockApi
          .expects('submitReview')
          .withArgs(params)
          .returns(Promise.resolve(ratingResponse));

        return actions.createRating({
          ...params, router, userId, addonId,
        })
          .then(() => {
            assert.equal(dispatch.called, true);
            const action = dispatch.firstCall.args[0];

            assert.equal(action.type, SET_REVIEW);
            assert.equal(action.data.addonId, addonId);
            assert.equal(action.data.userId, userId);
            assert.deepEqual(action.data.rating, ratingResponse.rating);
            assert.deepEqual(action.data.versionId, ratingResponse.version.id);

            assert.equal(router.push.called, true);
            const { lang, clientApp } = signedInApiState;
            const reviewId = ratingResponse.id;
            assert.equal(
              router.push.firstCall.args[0],
              `/${lang}/${clientApp}/addon/${params.addonSlug}/review/${reviewId}/`);

            mockApi.verify();
          });
      });
    });

    describe('loadSavedRating', () => {
      const fakeReview = {
        addon: fakeAddon,
        rating: 3,
        version: fakeAddon.current_version,
        userId: 1234,
      };

      function loadSavedRating({
        userId = 123,
        addonId = fakeAddon.id,
        versionId = fakeAddon.current_version.id,
      } = {}) {
        return actions.loadSavedRating({ userId, addonId, versionId });
      }

      it('finds and dispatches a review', () => {
        const userId = 77664;
        const response = { results: [{ ...fakeReview, userId }] };

        mockApi
          .expects('getUserReviews')
          .withArgs({ userId })
          .returns(Promise.resolve(response));

        return loadSavedRating({ userId })
          .then(() => {
            mockApi.verify();
            assert.equal(dispatch.called, true);
            assert.deepEqual(dispatch.firstCall.args[0], setReview({
              addonId: fakeReview.addon.id,
              rating: fakeReview.rating,
              versionId: fakeReview.version.id,
              userId,
            }));
          });
      });

      it('only dispatches reviews for the right add-on', () => {
        const userId = 77664;
        const addonId = 8765;
        const response = {
          results: [
            // The first one should be ignored.
            { ...fakeReview, userId, addon: { ...fakeAddon, id: 123 } },
            { ...fakeReview, userId, addon: { ...fakeAddon, id: addonId } },
          ],
        };
        mockApi.expects('getUserReviews').returns(Promise.resolve(response));

        return loadSavedRating({ userId, addonId })
          .then(() => {
            assert.equal(dispatch.called, true);
            assert.deepEqual(dispatch.firstCall.args[0], setReview({
              addonId,
              rating: fakeReview.rating,
              versionId: fakeReview.version.id,
              userId,
            }));
          });
      });

      it('only dispatches reviews for the right version', () => {
        const userId = 77664;
        const versionId = 6672;
        const response = {
          results: [
            // The first one should be ignored.
            {
              ...fakeReview,
              userId,
              version: { ...fakeAddon.current_version, id: 123 },
            },
            {
              ...fakeReview,
              userId,
              version: { ...fakeAddon.current_version, id: versionId },
            },
          ],
        };
        mockApi.expects('getUserReviews').returns(Promise.resolve(response));

        return loadSavedRating({ userId, versionId })
          .then(() => {
            assert.equal(dispatch.called, true);
            assert.deepEqual(dispatch.firstCall.args[0], setReview({
              addonId: fakeReview.addon.id,
              rating: fakeReview.rating,
              versionId,
              userId,
            }));
          });
      });

      it('expects to only find one matching review', () => {
        const response = { results: [fakeReview, fakeReview] };
        mockApi.expects('getUserReviews').returns(Promise.resolve(response));

        return loadSavedRating()
          .then(() => {
            throw new Error('unexpected success');
          })
          .catch((error) => {
            assert.match(error.message, /received more than one review/);
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

    it('sets a user review when a matching review is in state', () => {
      const userId = 99821;
      const savedRating = 5;

      signIn({ userId });

      store.dispatch(setReview({
        userId,
        addonId: fakeAddon.id,
        versionId: fakeAddon.current_version.id,
        rating: savedRating,
      }));

      assert.equal(getMappedProps().userReview.rating, savedRating);
    });

    it('ignores reviews from other users', () => {
      const userIdOne = 1;
      const userIdTwo = 2;
      const savedRating = 5;

      signIn({ userId: userIdOne });

      // Save a review for user two.
      store.dispatch(setReview({
        userId: userIdTwo,
        addonId: fakeAddon.id,
        versionId: fakeAddon.current_version.id,
        rating: savedRating,
      }));

      assert.strictEqual(getMappedProps().userReview, undefined);
    });

    it('ignores reviews for another add-on', () => {
      const userId = 99821;
      const savedRating = 5;

      signIn({ userId });

      store.dispatch(setReview({
        userId,
        addonId: 554433, // this is a review for an unrelated add-on
        versionId: fakeAddon.current_version.id,
        rating: savedRating,
      }));

      assert.strictEqual(getMappedProps().userReview, undefined);
    });

    it('ignores reviews for another add-on version', () => {
      const userId = 99821;
      const savedRating = 5;

      signIn({ userId });

      store.dispatch(setReview({
        userId,
        addonId: fakeAddon.id,
        versionId: {
          ...fakeAddon.current_version,
          id: 44422, // this is a review for another version
        },
        rating: savedRating,
      }));

      assert.strictEqual(getMappedProps().userReview, undefined);
    });
  });
});
