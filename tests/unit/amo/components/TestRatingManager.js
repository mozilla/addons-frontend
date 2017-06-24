import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';

import translate from 'core/i18n/translate';
import { setAuthToken } from 'core/actions';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { initialApiState } from 'core/reducers/api';
import * as amoApi from 'amo/api';
import createStore from 'amo/store';
import { setReview } from 'amo/actions/reviews';
import {
  mapDispatchToProps, mapStateToProps, RatingManagerBase,
} from 'amo/components/RatingManager';
import {
  fakeAddon, fakeReview, signedInApiState,
} from 'tests/unit/amo/helpers';
import { getFakeI18nInst, userAuthToken } from 'tests/unit/helpers';

function render(customProps = {}) {
  const props = {
    Review: () => <div />,
    AuthenticateButton: () => <div />,
    addon: fakeAddon,
    apiState: signedInApiState,
    errorHandler: sinon.stub(),
    location: { pathname: '/some/location/' },
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
    expect(root.ratingLegend.textContent).toContain('Some Add-on');
  });

  it('loads saved ratings on construction', () => {
    const userId = 12889;
    const addon = { ...fakeAddon, id: 3344 };
    const version = {
      ...fakeAddon.current_version,
      id: 9966,
    };
    const loadSavedReview = sinon.spy();

    render({
      apiState: signedInApiState, userId, addon, version, loadSavedReview,
    });

    expect(loadSavedReview.called).toEqual(true);
    const args = loadSavedReview.firstCall.args[0];
    expect(args).toEqual({
      apiState: signedInApiState,
      userId,
      addonId: addon.id,
      versionId: version.id,
    });
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
    });
    return root.onSelectRating(5)
      .then(() => {
        expect(submitReview.called).toEqual(true);

        const call = submitReview.firstCall.args[0];
        expect(call.versionId).toEqual(321);
        expect(call.apiState.token).toEqual('new-token');
        expect(call.addonId).toEqual(12345);
        expect(call.errorHandler).toEqual(errorHandler);
        expect(call.reviewId).toBe(undefined);
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
        expect(submitReview.called).toBeTruthy();

        const call = submitReview.firstCall.args[0];
        expect(call.reviewId).toBeTruthy();
        expect(call.reviewId).toEqual(fakeReview.id);
        expect(call.versionId).toEqual(fakeReview.version.id);
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
        expect(submitReview.called).toBeTruthy();

        // Make sure the review is submitted in a way where it will be
        // newly created against the current version.
        const call = submitReview.firstCall.args[0];
        expect(call.reviewId).toEqual(undefined);
        expect(call.versionId).toEqual(addon.current_version.id);
        expect(call.rating).toEqual(newReview.rating);
        expect(call.addonId).toEqual(newReview.addon.id);
      });
  });

  it('renders and configures Review after submitting a rating', () => {
    const userReview = setReview(fakeReview).payload;
    const FakeReview = sinon.spy(() => <div />);
    const root = render({ Review: FakeReview, userReview });

    expect(FakeReview.called).toEqual(false);

    return root.onSelectRating(5)
      .then(() => {
        expect(FakeReview.called).toBeTruthy();

        const props = FakeReview.firstCall.args[0];
        expect(props.review).toEqual(userReview);

        // Now make sure the callback is configured.
        expect(root.state.showTextEntry).toEqual(true);
        // Trigger the callback just like Review would after completion.
        props.onReviewSubmitted();
        expect(root.state.showTextEntry).toEqual(false);
      });
  });

  it('does not render an Review when logged out', () => {
    const userReview = setReview(fakeReview).payload;
    const FakeReview = sinon.spy(() => <div />);
    const userId = null; // logged out
    const root = render({ Review: FakeReview, userReview, userId });

    expect(FakeReview.called).toEqual(false);

    return root.onSelectRating(5)
      .then(() => {
        expect(FakeReview.called).toBeFalsy();
      });
  });

  it('configures a rating component', () => {
    const userReview = setReview(fakeReview).payload;
    const RatingStub = sinon.spy(() => (<div />));

    const root = render({ Rating: RatingStub, userReview });

    expect(RatingStub.called).toEqual(true);
    const props = RatingStub.firstCall.args[0];
    expect(props.onSelectRating).toEqual(root.onSelectRating);
    expect(props.rating).toEqual(userReview.rating);
  });

  it('sets a blank rating when there is no saved review', () => {
    const RatingStub = sinon.spy(() => (<div />));

    render({ Rating: RatingStub, userReview: null });

    expect(RatingStub.called).toEqual(true);
    const props = RatingStub.firstCall.args[0];
    expect(props.rating).toBe(undefined);
  });

  describe('when user is signed out', () => {
    function renderWithoutUser(customProps = {}) {
      return render({ userId: null, ...customProps });
    }

    function getAuthPromptForType(addonType) {
      const AuthenticateButton = sinon.spy(() => <div />);
      renderWithoutUser({
        AuthenticateButton,
        addon: { ...fakeAddon, type: addonType },
      });
      expect(AuthenticateButton.called).toBeTruthy();
      const props = AuthenticateButton.firstCall.args[0];
      return props.logInText;
    }

    it('does not load saved ratings', () => {
      const loadSavedReview = sinon.spy();
      renderWithoutUser({ loadSavedReview });
      expect(loadSavedReview.called).toEqual(false);
    });

    it('renders an AuthenticateButton', () => {
      const AuthenticateButton = sinon.spy(() => <div />);
      const location = { pathname: '/some/path/' };
      renderWithoutUser({ AuthenticateButton, location });

      expect(AuthenticateButton.called).toBeTruthy();
      const props = AuthenticateButton.firstCall.args[0];
      expect(props.location).toEqual(location);
    });

    it('renders a login prompt for the dictionary', () => {
      const prompt = getAuthPromptForType(ADDON_TYPE_DICT);
      expect(prompt).toContain('dictionary');
    });

    it('renders a login prompt for the extension', () => {
      const prompt = getAuthPromptForType(ADDON_TYPE_EXTENSION);
      expect(prompt).toContain('extension');
    });

    it('renders a login prompt for the language pack', () => {
      const prompt = getAuthPromptForType(ADDON_TYPE_LANG);
      expect(prompt).toContain('language pack');
    });

    it('renders a login prompt for the search plugin', () => {
      const prompt = getAuthPromptForType(ADDON_TYPE_OPENSEARCH);
      expect(prompt).toContain('search plugin');
    });

    it('renders a login prompt for themes', () => {
      const prompt = getAuthPromptForType(ADDON_TYPE_THEME);
      expect(prompt).toContain('theme');
    });

    it('cannot render a login prompt for unknown extension types', () => {
      expect(() => getAuthPromptForType('xul'))
        .toThrowError(/Unknown extension type: xul/);
    });

    it('renders a random valid extension type', () => {
      const root = renderWithoutUser();
      // This simulates a future code change where a valid type is added
      // but we haven't given it a custom prompt yet.
      const prompt = root.getLogInPrompt(
        { addonType: 'banana' },
        { validAddonTypes: ['banana'] }
      );
      // The prompt should just call it an add-on:
      expect(prompt).toContain('add-on');
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
            expect(dispatch.called).toEqual(true);
            const action = dispatch.firstCall.args[0];
            expect(action).toEqual(setReview(fakeReview));
            mockApi.verify();
          });
      });
    });

    describe('loadSavedReview', () => {
      it('finds and dispatches a review', () => {
        const userId = fakeReview.user.id;
        const addonId = fakeReview.addon.id;
        const versionId = fakeReview.version.id;
        mockApi
          .expects('getLatestUserReview')
          .withArgs({
            apiState: signedInApiState,
            user: userId,
            addon: addonId,
            version: versionId,
          })
          .returns(Promise.resolve(fakeReview));

        return actions.loadSavedReview({
          apiState: signedInApiState, userId, addonId, versionId,
        })
          .then(() => {
            mockApi.verify();
            expect(dispatch.called).toEqual(true);
            expect(dispatch.firstCall.args[0]).toEqual(setReview(fakeReview));
          });
      });

      it('does nothing when there are not any matching reviews', () => {
        const addonId = 8765;
        mockApi.expects('getLatestUserReview').returns(Promise.resolve(null));

        return actions.loadSavedReview({
          apiState: initialApiState, userId: 123, addonId,
        })
          .then(() => {
            expect(dispatch.called).toEqual(false);
          });
      });
    });
  });

  describe('mapStateToProps', () => {
    let store;

    beforeEach(() => {
      store = createStore().store;
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
      store.dispatch(setAuthToken(userAuthToken({
        user_id: userId,
      })));
    }

    it('copies api state to props', () => {
      signIn();

      const state = store.getState();
      expect(state.api.token).toBeTruthy();

      const props = getMappedProps();
      expect(props.apiState).toEqual(state.api);
    });

    it('sets an empty apiState when not signed in', () => {
      expect(getMappedProps().apiState).toEqual({ ...initialApiState });
    });

    it('sets an empty userId when not signed in', () => {
      expect(getMappedProps().userId).toEqual(undefined);
    });

    it('sets the userId property from the state', () => {
      const userId = 91234;
      signIn({ userId });
      expect(getMappedProps().userId).toEqual(userId);
    });

    it('sets an empty user review when no reviews are in state', () => {
      signIn();
      expect(getMappedProps().userReview).toBe(undefined);
    });

    it('sets a user review to the latest matching one in state', () => {
      signIn({ userId: fakeReview.user.id });

      const action = setReview({ ...fakeReview, is_latest: true });
      store.dispatch(action);
      const dispatchedReview = action.payload;

      const userReview = getMappedProps().userReview;
      expect(userReview).toEqual(dispatchedReview);
    });

    it('ignores reviews from other users', () => {
      const userIdOne = 1;
      const userIdTwo = 2;
      const savedRating = 5;

      signIn({ userId: userIdOne });

      // Save a review for user two.
      store.dispatch(setReview({
        ...fakeReview,
        is_latest: true,
        user: {
          ...fakeReview.user,
          id: userIdTwo,
        },
        rating: savedRating,
      }));

      expect(getMappedProps().userReview).toBe(undefined);
    });

    it('ignores reviews for another add-on', () => {
      signIn({ userId: fakeReview.user.id });

      store.dispatch(setReview(fakeReview, {
        isLatest: true,
        addonId: 554433, // this is a review for an unrelated add-on
      }));

      expect(getMappedProps().userReview).toBe(undefined);
    });

    it('only finds the latest review for an add-on', () => {
      signIn({ userId: fakeReview.user.id });

      function createReview(overrides) {
        const action = setReview({ ...fakeReview, ...overrides });
        store.dispatch(action);
        return action.payload;
      }

      createReview({
        id: 1,
        is_latest: false,
      });
      const latestReview = createReview({
        id: 2,
        is_latest: true,
      });

      expect(getMappedProps().userReview).toEqual(latestReview);
    });
  });
});
