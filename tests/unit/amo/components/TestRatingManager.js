import * as React from 'react';
import { Provider } from 'react-redux';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-dom/test-utils';

import { setAuthToken } from 'core/actions';
import { createInternalAddon } from 'core/reducers/addons';
import { loadCurrentUserAccount } from 'amo/reducers/users';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { initialApiState } from 'core/reducers/api';
import * as reviewsApi from 'amo/api/reviews';
import createStore from 'amo/store';
import {
  denormalizeReview,
  setLatestReview,
  setReview,
} from 'amo/actions/reviews';
import {
  RatingManagerBase,
  RatingManagerWithI18n,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/components/RatingManager';
import {
  fakeAddon,
  fakeReview,
  signedInApiState,
} from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  createUserAccountResponse,
  fakeI18n,
  createFakeLocation,
  userAuthToken,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = createStore().store;
  });

  function render(customProps = {}) {
    const props = {
      AddonReview: () => <div />,
      AuthenticateButton: () => <div />,
      ReportAbuseButton: () => <div />,
      addon: createInternalAddon(fakeAddon),
      apiState: signedInApiState,
      errorHandler: createStubErrorHandler(),
      location: createFakeLocation({ pathname: '/some/location/' }),
      version: fakeAddon.current_version,
      userId: 91234,
      submitReview: () => Promise.resolve(),
      loadSavedReview: () => Promise.resolve(),
      store,
      ...customProps,
    };

    const root = findRenderedComponentWithType(
      renderIntoDocument(
        <I18nProvider i18n={fakeI18n()}>
          <Provider store={props.store}>
            <RatingManagerWithI18n {...props} />
          </Provider>
        </I18nProvider>,
      ),
      RatingManagerBase,
    );

    return root;
  }

  it('prompts you to rate the add-on by name', () => {
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, name: 'Some Add-on' }),
    });
    expect(root.ratingLegend.textContent).toContain('Some Add-on');
  });

  it('loads saved ratings on construction', () => {
    const userId = 12889;
    const addon = createInternalAddon({ ...fakeAddon, id: 3344 });
    const version = {
      ...fakeAddon.current_version,
      id: 9966,
    };
    const loadSavedReview = sinon.spy();

    render({
      apiState: signedInApiState,
      userId,
      addon,
      version,
      loadSavedReview,
    });

    sinon.assert.calledWith(loadSavedReview, {
      apiState: signedInApiState,
      userId,
      addonId: addon.id,
      addonSlug: addon.slug,
      versionId: version.id,
    });
  });

  it('does not load a saved review when none exists', () => {
    const userId = 12889;
    const addon = createInternalAddon({ ...fakeAddon, id: 3344 });
    const version = {
      ...fakeAddon.current_version,
      id: 9966,
    };
    const loadSavedReview = sinon.spy();

    render({
      apiState: signedInApiState,
      userId,
      addon,
      version,
      loadSavedReview,
      userReview: null,
    });

    sinon.assert.notCalled(loadSavedReview);
  });

  it('creates a rating with add-on and version info', () => {
    const errorHandler = sinon.stub();
    const submitReview = sinon.spy(() => Promise.resolve());
    const root = render({
      errorHandler,
      submitReview,
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: 321 },
      addon: createInternalAddon({
        ...fakeAddon,
        id: 12345,
        slug: 'some-slug',
      }),
    });
    return root.onSelectRating(5).then(() => {
      sinon.assert.called(submitReview);

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
    return root.onSelectRating(5).then(() => {
      sinon.assert.called(submitReview);

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
    const addon = createInternalAddon({
      ...fakeAddon,
      id: newReview.addon.id,
    });

    const root = render({
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: oldVersionId },
      userId: 92345,
      userReview: setReview(newReview).payload,
      submitReview,
      addon,
    });
    return root.onSelectRating(newReview.rating).then(() => {
      sinon.assert.called(submitReview);

      // Make sure the review is submitted in a way where it will be
      // newly created against the current version.
      const call = submitReview.firstCall.args[0];
      expect(call.reviewId).toEqual(undefined);
      expect(call.versionId).toEqual(addon.current_version.id);
      expect(call.rating).toEqual(newReview.rating);
      expect(call.addonId).toEqual(newReview.addon.id);
    });
  });

  it('renders and configures AddonReview after submitting a rating', () => {
    const userReview = setReview(fakeReview).payload;
    const FakeAddonReview = sinon.spy(() => <div />);
    const root = render({ AddonReview: FakeAddonReview, userReview });

    sinon.assert.notCalled(FakeAddonReview);

    return root.onSelectRating(5).then(() => {
      sinon.assert.called(FakeAddonReview);

      const props = FakeAddonReview.firstCall.args[0];
      expect(props.review).toEqual(userReview);

      // Now make sure the callback is configured.
      expect(root.state.showTextEntry).toEqual(true);
      // Trigger the callback just like AddonReview would
      // after completion.
      props.onReviewSubmitted();
      expect(root.state.showTextEntry).toEqual(false);
    });
  });

  it('calls back to the parent component after submitting a review', () => {
    const userReview = setReview(fakeReview).payload;
    const FakeAddonReview = sinon.spy(() => <div />);
    const parentOnReviewSubmitted = sinon.stub();
    const root = render({
      AddonReview: FakeAddonReview,
      userReview,
      onReviewSubmitted: parentOnReviewSubmitted,
    });

    // Select a rating to open the submit review UI.
    return root.onSelectRating(5).then(() => {
      sinon.assert.called(FakeAddonReview);
      const props = FakeAddonReview.firstCall.args[0];

      // Simulate pressing submit in the review UI.
      props.onReviewSubmitted();

      // Make sure the parent's callback was executed.
      sinon.assert.called(parentOnReviewSubmitted);
    });
  });

  it('does not render an AddonReview when logged out', () => {
    const userReview = setReview(fakeReview).payload;
    const FakeAddonReview = sinon.spy(() => <div />);
    const userId = null; // logged out
    const root = render({ AddonReview: FakeAddonReview, userReview, userId });

    sinon.assert.notCalled(FakeAddonReview);

    return root.onSelectRating(5).then(() => {
      sinon.assert.notCalled(FakeAddonReview);
    });
  });

  it('configures a rating component', () => {
    const userReview = setReview(fakeReview).payload;
    const UserRatingStub = sinon.spy(() => <div />);

    const root = render({ UserRating: UserRatingStub, userReview });

    sinon.assert.called(UserRatingStub);
    const props = UserRatingStub.firstCall.args[0];
    expect(props.onSelectRating).toEqual(root.onSelectRating);
    expect(props.review).toEqual(userReview);
  });

  it('sets an undefined UserRating review when none exists', () => {
    const UserRatingStub = sinon.spy(() => <div />);

    const root = render({ UserRating: UserRatingStub, userReview: null });

    sinon.assert.calledWithMatch(UserRatingStub, {
      review: undefined,
    });
  });

  it('sets a blank rating when there is no saved review', () => {
    const UserRatingStub = sinon.spy(() => <div />);

    render({ UserRating: UserRatingStub, userReview: null });

    sinon.assert.called(UserRatingStub);
    const props = UserRatingStub.firstCall.args[0];
    expect(props.rating).toBe(undefined);
  });

  it('passes an add-on to the report abuse button', () => {
    const ReportAbuseButton = sinon.spy(() => <div />);
    const addon = createInternalAddon({ ...fakeAddon });
    render({ ReportAbuseButton, addon });

    sinon.assert.calledWithMatch(ReportAbuseButton, { addon });
  });

  describe('when user is signed out', () => {
    function renderWithoutUser(customProps = {}) {
      return render({ userId: null, ...customProps });
    }

    function getAuthPromptForType(addonType) {
      const AuthenticateButton = sinon.spy(() => <div />);
      renderWithoutUser({
        AuthenticateButton,
        addon: createInternalAddon({ ...fakeAddon, type: addonType }),
      });
      sinon.assert.called(AuthenticateButton);
      const props = AuthenticateButton.firstCall.args[0];
      return props.logInText;
    }

    it('does not load saved ratings', () => {
      const loadSavedReview = sinon.spy();
      renderWithoutUser({ loadSavedReview });
      sinon.assert.notCalled(loadSavedReview);
    });

    it('renders an AuthenticateButton', () => {
      const AuthenticateButton = sinon.spy(() => <div />);
      const location = createFakeLocation();
      renderWithoutUser({ AuthenticateButton, location });

      sinon.assert.called(AuthenticateButton);
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

    it('renders a login prompt for static themes', () => {
      const prompt = getAuthPromptForType(ADDON_TYPE_STATIC_THEME);
      expect(prompt).toContain('theme');
    });

    // Since you can view this page if you're logged in -
    // to be consistent - we'll do the same if you're logged out.
    // See: https://github.com/mozilla/addons-frontend/issues/3601.
    it('renders a login prompt for unknown extension types', () => {
      const prompt = getAuthPromptForType('xul');
      expect(prompt).toContain('add-on');
    });

    it('renders a random valid extension type', () => {
      const root = renderWithoutUser();
      // This simulates a future code change where a valid type is added
      // but we haven't given it a custom prompt yet.
      const prompt = root.getLogInPrompt(
        { addonType: 'banana' },
        { validAddonTypes: ['banana'] },
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
      mockApi = sinon.mock(reviewsApi);
      dispatch = sinon.stub();
      actions = mapDispatchToProps(dispatch);
    });

    describe('submitReview', () => {
      it('posts the review and dispatches the created review', () => {
        const params = {
          rating: fakeReview.rating,
          apiState: { ...signedInApiState, token: 'new-token' },
          addonId: fakeAddon.id,
          versionId: fakeReview.version.id,
        };

        const reviewResult = { ...fakeReview };
        mockApi
          .expects('submitReview')
          .withArgs(params)
          .returns(Promise.resolve(reviewResult));

        return actions.submitReview(params).then(() => {
          sinon.assert.calledWith(
            dispatch,
            setLatestReview({
              addonId: reviewResult.addon.id,
              addonSlug: reviewResult.addon.slug,
              userId: reviewResult.user.id,
              versionId: reviewResult.version.id,
              review: reviewResult,
            }),
          );
          mockApi.verify();
        });
      });

      it('falls back to version ID parameter', () => {
        const versionId = 54321;
        const params = {
          rating: fakeReview.rating,
          apiState: { ...signedInApiState, token: 'new-token' },
          addonId: fakeAddon.id,
          versionId,
        };

        // Simulate a review for a deleted add-on version.
        const reviewResult = { ...fakeReview, version: undefined };
        mockApi.expects('submitReview').returns(Promise.resolve(reviewResult));

        return actions.submitReview(params).then(() => {
          sinon.assert.calledWith(
            dispatch,
            setLatestReview({
              addonId: reviewResult.addon.id,
              addonSlug: reviewResult.addon.slug,
              userId: reviewResult.user.id,
              versionId,
              review: reviewResult,
            }),
          );
        });
      });
    });

    describe('loadSavedReview', () => {
      it('finds and dispatches a review', () => {
        const userId = fakeReview.user.id;
        const addonId = fakeReview.addon.id;
        const addonSlug = fakeReview.addon.slug;
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

        return actions
          .loadSavedReview({
            apiState: signedInApiState,
            userId,
            addonId,
            addonSlug,
            versionId,
          })
          .then(() => {
            mockApi.verify();
            sinon.assert.calledWith(
              dispatch,
              setLatestReview({
                userId,
                addonId,
                addonSlug,
                versionId,
                review: fakeReview,
              }),
            );
          });
      });

      it('sets the latest review to null when none exists', () => {
        const userId = 123;
        const addonId = 8765;
        const addonSlug = 'some-slug';
        const versionId = 5421;
        mockApi.expects('getLatestUserReview').returns(Promise.resolve(null));

        return actions
          .loadSavedReview({
            apiState: initialApiState,
            userId,
            addonId,
            addonSlug,
            versionId,
          })
          .then(() => {
            sinon.assert.calledWith(
              dispatch,
              setLatestReview({
                addonId,
                addonSlug,
                userId,
                versionId,
                review: null,
              }),
            );
          });
      });
    });
  });

  describe('mapStateToProps', () => {
    function getMappedProps({
      state = store.getState(),
      componentProps = {
        addon: createInternalAddon(fakeAddon),
        version: fakeAddon.current_version,
      },
    } = {}) {
      return mapStateToProps(state, componentProps);
    }

    function signIn({ userId = 98765 } = {}) {
      store.dispatch(setAuthToken(userAuthToken()));
      store.dispatch(
        loadCurrentUserAccount({
          user: createUserAccountResponse({ id: userId }),
        }),
      );
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
      expect(getMappedProps().userId).toEqual(null);
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

    it('sets a userReview', () => {
      const userId = 91234;
      const addon = createInternalAddon(fakeAddon);
      const version = fakeAddon.current_version;

      signIn({ userId });
      store.dispatch(
        setLatestReview({
          addonId: addon.id,
          addonSlug: addon.slug,
          userId,
          versionId: version.id,
          review: fakeReview,
        }),
      );

      expect(
        getMappedProps({ componentProps: { addon, version } }).userReview,
      ).toEqual(denormalizeReview(fakeReview));
    });

    it('sets a null userReview', () => {
      const userId = 91234;
      const addon = createInternalAddon(fakeAddon);
      const version = fakeAddon.current_version;

      signIn({ userId });
      store.dispatch(
        setLatestReview({
          addonId: addon.id,
          addonSlug: addon.slug,
          userId,
          versionId: version.id,
          review: null,
        }),
      );

      expect(
        getMappedProps({ componentProps: { addon, version } }).userReview,
      ).toEqual(null);
    });
  });
});
