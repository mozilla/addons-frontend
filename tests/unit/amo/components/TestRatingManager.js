import * as React from 'react';

import { createInternalAddon } from 'core/reducers/addons';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { initialApiState } from 'core/reducers/api';
import * as reviewsApi from 'amo/api/reviews';
import { selectReview } from 'amo/reducers/reviews';
import { logOutUser } from 'amo/reducers/users';
import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  createAddonReview,
  createInternalReview,
  flashReviewMessage,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  setLatestReview,
  setReview,
  showEditReviewForm,
  updateAddonReview,
} from 'amo/actions/reviews';
import AddonReview from 'amo/components/AddonReview';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonReviewManager from 'amo/components/AddonReviewManager';
import RatingManager, {
  RatingManagerBase,
  mapDispatchToProps,
} from 'amo/components/RatingManager';
import RatingManagerNotice from 'amo/components/RatingManagerNotice';
import ReportAbuseButton from 'amo/components/ReportAbuseButton';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { genericType, successType } from 'ui/components/Notice';
import UserRating from 'ui/components/UserRating';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeReview,
} from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render(customProps = {}) {
    const _config = getFakeConfig({
      enableFeatureInlineAddonReview: false,
    });
    const props = {
      addon: createInternalAddon(fakeAddon),
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      loadSavedReview: () => Promise.resolve(),
      store: dispatchSignInActions().store,
      submitReview: () => Promise.resolve(),
      userId: 91234,
      version: fakeAddon.current_version,
      _config,
      ...customProps,
    };

    return shallowUntilTarget(<RatingManager {...props} />, RatingManagerBase);
  }

  const createStoreWithLatestReview = ({
    addon = createInternalAddon(fakeAddon),
    review = fakeReview,
    userId = 92345,
    versionId = review ? review.version.id : fakeAddon.current_version.id,
  } = {}) => {
    const { store } = dispatchSignInActions({ userId });

    if (review) {
      store.dispatch(setReview(review));
    }
    store.dispatch(
      setLatestReview({
        addonId: addon.id,
        addonSlug: addon.slug,
        review,
        userId,
        versionId,
      }),
    );

    return store;
  };

  it('prompts you to rate the add-on by name', () => {
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, name: 'Some Add-on' }),
    });

    expect(root.find('.RatingManager-legend')).toIncludeText('Some Add-on');
  });

  it('loads saved ratings on construction', () => {
    const userId = 12889;
    const addon = createInternalAddon({ ...fakeAddon, id: 3344 });
    const version = {
      ...fakeAddon.current_version,
      id: 9966,
    };
    const loadSavedReview = sinon.spy();

    const { store } = dispatchSignInActions({ userId });

    render({ addon, loadSavedReview, store, version });

    sinon.assert.calledWith(loadSavedReview, {
      addonId: addon.id,
      addonSlug: addon.slug,
      apiState: store.getState().api,
      userId,
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

    const store = createStoreWithLatestReview({
      addon,
      review: null,
      userId,
      versionId: version.id,
    });

    render({ addon, version, store, loadSavedReview });

    sinon.assert.notCalled(loadSavedReview);
  });

  it('passes review=undefined before the saved review has loaded', () => {
    const addon = createInternalAddon({ ...fakeAddon });
    const { store } = dispatchSignInActions();

    const root = render({ addon, store });

    expect(root.find(UserRating)).toHaveProp('review', undefined);
  });

  it('passes review=null if no user is signed in', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    // This does not trigger a loading state.
    expect(root.find(UserRating)).toHaveProp('review', null);
  });

  it('passes the review once it has loaded', () => {
    const externalReview = { ...fakeReview, id: 432 };
    const store = createStoreWithLatestReview({ review: externalReview });
    const root = render({ store });

    const rating = root.find(UserRating);
    expect(rating).toHaveProp('review', createInternalReview(externalReview));
  });

  it('passes review=null when no saved review exists', () => {
    const store = createStoreWithLatestReview({ review: null });
    const root = render({ store });

    // This exits the loading state.
    expect(root.find(UserRating)).toHaveProp('review', null);
  });

  it('creates a rating with add-on and version info', () => {
    const submitReview = sinon.spy(() => Promise.resolve());

    const addon = createInternalAddon({
      ...fakeAddon,
      id: 12345,
      slug: 'some-slug',
    });
    const version = { id: 321 };

    const { store } = dispatchSignInActions();

    const root = render({ addon, store, submitReview, version });

    return root
      .instance()
      .onSelectRating(5)
      .then(() => {
        sinon.assert.calledWith(
          submitReview,
          sinon.match({
            addonId: addon.id,
            apiState: store.getState().api,
            errorHandler: root.instance().props.errorHandler,
            reviewId: undefined,
            versionId: version.id,
          }),
        );
      });
  });

  it('updates a rating with the review ID', () => {
    const addon = createInternalAddon(fakeAddon);
    const review = fakeReview;
    const store = createStoreWithLatestReview({ addon, review });

    const submitReview = sinon.spy(() => Promise.resolve());

    const root = render({ addon, store, submitReview });

    return root
      .instance()
      .onSelectRating(5)
      .then(() => {
        sinon.assert.calledWith(
          submitReview,
          sinon.match({
            reviewId: review.id,
            versionId: review.version.id,
          }),
        );
      });
  });

  it('does not update an existing review if its version does not match', () => {
    const userId = 92345;
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

    const store = createStoreWithLatestReview({
      addon,
      review: newReview,
      userId,
      versionId: oldVersionId,
    });

    const root = render({ submitReview, addon, store });

    return root
      .instance()
      .onSelectRating(newReview.score)
      .then(() => {
        // Make sure the review is submitted in a way where it will be newly
        // created against the current version.
        sinon.assert.calledWith(
          submitReview,
          sinon.match({
            reviewId: undefined,
            versionId: addon.current_version.id,
            score: newReview.score,
            addonId: newReview.addon.id,
          }),
        );
      });
  });

  it('renders and configures AddonReview after submitting a rating', () => {
    const store = createStoreWithLatestReview();
    const root = render({ store });

    expect(root.find(AddonReview)).toHaveLength(0);

    return root
      .instance()
      .onSelectRating(5)
      .then(() => {
        root.update();

        expect(root.find(AddonReview)).toHaveLength(1);

        expect(root).toHaveState('showTextEntry', true);

        // Trigger the callback just like AddonReview would after completion.
        root.find(AddonReview).prop('onReviewSubmitted')();

        expect(root).toHaveState('showTextEntry', false);
      });
  });

  it('calls back to the parent component after submitting a review', () => {
    const parentOnReviewSubmitted = sinon.stub();
    const store = createStoreWithLatestReview();

    const root = render({
      onReviewSubmitted: parentOnReviewSubmitted,
      store,
    });

    expect(root.find(AddonReview)).toHaveLength(0);

    // Select a rating to open the submit review UI.
    return root
      .instance()
      .onSelectRating(5)
      .then(() => {
        root.update();

        expect(root.find(AddonReview)).toHaveLength(1);

        // Simulate pressing submit in the review UI.
        root.find(AddonReview).prop('onReviewSubmitted')();

        // Make sure the parent's callback was executed.
        sinon.assert.called(parentOnReviewSubmitted);
      });
  });

  it('does not render an AddonReview when logged out', () => {
    const { store } = dispatchClientMetadata();

    const root = render({ store });

    expect(root.find(AddonReview)).toHaveLength(0);

    return root
      .instance()
      .onSelectRating(5)
      .then(() => {
        expect(root.find(AddonReview)).toHaveLength(0);
      });
  });

  it('configures a rating component', () => {
    const review = fakeReview;
    const store = createStoreWithLatestReview({ review });

    const root = render({ store });

    expect(root.find(UserRating)).toHaveLength(1);
    expect(root.find(UserRating)).toHaveProp(
      'onSelectRating',
      root.instance().onSelectRating,
    );
    expect(root.find(UserRating)).toHaveProp(
      'review',
      selectReview(store.getState().reviews, review.id),
    );
  });

  it('sets an undefined UserRating review when none exists', () => {
    const root = render();

    expect(root.find(UserRating)).toHaveLength(1);
    expect(root.find(UserRating)).toHaveProp('review', undefined);
  });

  it('sets a blank rating when there is no saved review', () => {
    const root = render();

    expect(root.find(UserRating)).toHaveLength(1);
    expect(root.find(UserRating)).toHaveProp('review', undefined);
  });

  it('passes an add-on to the report abuse button', () => {
    const addon = createInternalAddon({ ...fakeAddon });

    const root = render({ addon });

    expect(root.find(ReportAbuseButton)).toHaveLength(1);
    expect(root.find(ReportAbuseButton)).toHaveProp('addon', addon);
  });

  it('flashes a saving rating message', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));

    const root = render({ store });

    const message = root.find(RatingManagerNotice);
    expect(message).toHaveProp('message', 'Saving star rating');
    expect(message).toHaveProp('type', genericType);
    expect(message).toHaveProp('hideMessage', false);
  });

  it('flashes a saved rating message', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(flashReviewMessage(SAVED_RATING));

    const root = render({ store });

    const message = root.find(RatingManagerNotice);
    expect(message).toHaveProp('message', 'Star rating saved');
    expect(message).toHaveProp('type', successType);
    expect(message).toHaveProp('hideMessage', false);
  });

  it('hides a flashed rating message', () => {
    const { store } = dispatchClientMetadata();
    // Set a message then hide it.
    store.dispatch(flashReviewMessage(SAVED_RATING));
    store.dispatch(hideFlashedReviewMessage());

    const root = render({ store });

    const message = root.find(RatingManagerNotice);
    expect(message).toHaveProp('hideMessage', true);
  });

  it('sets a custom className for RatingManagerNotice when a review exists', () => {
    const store = createStoreWithLatestReview();
    const root = render({ store });
    const message = root.find(RatingManagerNotice);
    expect(message).toHaveProp(
      'className',
      'RatingManager-savedRating-withReview',
    );
  });
  it('does not set a custom className for RatingManagerNotice when no review exists', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });
    const message = root.find(RatingManagerNotice);
    expect(message).not.toHaveProp(
      'className',
      'RatingManager-savedRating-withReview',
    );
  });

  describe('when user is signed out', () => {
    function renderWithoutUser(customProps = {}) {
      const { store } = dispatchClientMetadata();

      return render({ store, ...customProps });
    }

    function getAuthPromptForType(addonType) {
      const root = renderWithoutUser({
        addon: createInternalAddon({ ...fakeAddon, type: addonType }),
      });

      expect(root.find(AuthenticateButton)).toHaveLength(1);

      return root.find(AuthenticateButton).prop('logInText');
    }

    it('does not load saved ratings', () => {
      const loadSavedReview = sinon.spy();
      renderWithoutUser({ loadSavedReview });
      sinon.assert.notCalled(loadSavedReview);
    });

    it('renders an AuthenticateButton', () => {
      const root = renderWithoutUser();

      expect(root.find(AuthenticateButton)).toHaveLength(1);
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
      const prompt = root
        .instance()
        .getLogInPrompt(
          { addonType: 'banana' },
          { validAddonTypes: ['banana'] },
        );
      // The prompt should just call it an add-on:
      expect(prompt).toContain('add-on');
    });
  });

  describe('enableFeatureInlineAddonReview', () => {
    function renderInline(otherProps = {}) {
      const _config = getFakeConfig({
        enableFeatureInlineAddonReview: true,
      });
      return render({ _config, ...otherProps });
    }

    it('renders a user rating prompt', () => {
      const root = renderInline();

      expect(root.find(UserRating)).toHaveLength(1);
      expect(root.find(AddonReviewManager)).toHaveLength(0);
    });

    it('does not show text entry after submitting a rating', async () => {
      const store = createStoreWithLatestReview();
      const root = renderInline({ store });
      expect(root.find(AddonReviewManager)).toHaveLength(0);

      await root.instance().onSelectRating(5);

      // Unlike the previous behavior, this should not enter the text entry state.
      expect(root).toHaveState('showTextEntry', false);
    });

    it('does not render AddonReviewManager if not signed in', async () => {
      const store = createStoreWithLatestReview();
      store.dispatch(logOutUser());
      const root = renderInline({ store });

      root.setState({ showTextEntry: true });

      expect(root.find(AddonReviewManager)).toHaveLength(0);
      expect(root.find(UserRating)).toHaveLength(1);
    });

    it('does not render AddonReviewManager without a saved review', async () => {
      const addon = createInternalAddon({ ...fakeAddon, id: 7777 });
      const userId = 9876;
      const versionId = 1234;
      const { store } = dispatchSignInActions({ userId });

      store.dispatch(
        setLatestReview({
          addonId: addon.id,
          addonSlug: addon.slug,
          review: null,
          userId,
          versionId,
        }),
      );
      const root = renderInline({ addon, store, version: versionId });

      root.setState({ showTextEntry: true });

      expect(root.find(AddonReviewManager)).toHaveLength(0);
      expect(root.find(UserRating)).toHaveLength(1);
    });

    it('renders an AuthenticateButton when not signed in', () => {
      const { store } = dispatchClientMetadata();
      const root = renderInline({ store });

      expect(root.find(AuthenticateButton)).toHaveLength(1);
    });

    it('configures UserRating when signed out', async () => {
      const root = renderInline({ store: dispatchClientMetadata().store });

      const rating = root.find(UserRating);
      expect(rating).toHaveLength(1);
      expect(rating).toHaveProp('readOnly', true);
      expect(rating).toHaveProp('review', null);
    });

    it('shows AddonReviewCard with a saved review', () => {
      const review = {
        ...fakeReview,
        body: 'This is hands down the best ad blocker',
      };
      const root = renderInline({
        store: createStoreWithLatestReview({ review }),
      });

      const reviewCard = root.find(AddonReviewCard);
      expect(reviewCard).toHaveProp('review', createInternalReview(review));
    });

    it('shows an AddonReviewCard with a larger button', () => {
      const root = renderInline({
        store: createStoreWithLatestReview(),
      });

      expect(root.find(AddonReviewCard)).toHaveProp(
        'smallerWriteReviewButton',
        false,
      );
    });

    it('shows controls by default', () => {
      const root = renderInline({
        store: createStoreWithLatestReview(),
      });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', true);
    });

    it('hides controls while showing a saving notification', () => {
      const store = createStoreWithLatestReview();

      store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));
      const root = renderInline({ store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', false);
    });

    it('hides controls while showing a saved notification', () => {
      const store = createStoreWithLatestReview();

      store.dispatch(flashReviewMessage(SAVED_RATING));
      const root = renderInline({ store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', false);
    });

    it('shows controls when a notification is hidden', () => {
      const store = createStoreWithLatestReview();
      // Set a message then hide it.
      store.dispatch(flashReviewMessage(SAVED_RATING));
      store.dispatch(hideFlashedReviewMessage());
      const root = renderInline({ store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', true);
    });

    it('hides UserRating and prompt when editing', () => {
      const review = { ...fakeReview, id: 8877 };
      const store = createStoreWithLatestReview({ review });
      store.dispatch(showEditReviewForm({ reviewId: review.id }));
      const root = renderInline({ store });

      expect(root.find('.RatingManager-legend')).toHaveLength(0);
      expect(root.find(UserRating)).toHaveLength(0);
    });

    it('shows UserRating and prompt when not editing', () => {
      const review = { ...fakeReview, id: 8877 };
      const store = createStoreWithLatestReview({ review });

      store.dispatch(showEditReviewForm({ reviewId: review.id }));
      store.dispatch(hideEditReviewForm({ reviewId: review.id }));

      const root = renderInline({ store });

      expect(root.find('.RatingManager-legend')).toHaveLength(1);
      expect(root.find(UserRating)).toHaveLength(1);
    });

    it('submits a new rating', () => {
      const { store } = dispatchSignInActions();
      const addon = createInternalAddon(fakeAddon);
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const score = 5;
      const version = fakeAddon.current_version;

      const root = renderInline({ addon, errorHandler, store, version });

      // This emulates clicking on a rating star.
      root.find(UserRating).prop('onSelectRating')(score);

      sinon.assert.calledWith(
        dispatchSpy,
        createAddonReview({
          addonId: addon.id,
          errorHandlerId: errorHandler.id,
          score,
          versionId: version.id,
        }),
      );
    });

    it('updates an existing rating', () => {
      const store = createStoreWithLatestReview({ review: fakeReview });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const score = 5;

      const root = renderInline({ errorHandler, store });

      // This emulates clicking on a rating star.
      root.find(UserRating).prop('onSelectRating')(score);

      sinon.assert.calledWith(
        dispatchSpy,
        updateAddonReview({
          errorHandlerId: errorHandler.id,
          score,
          reviewId: fakeReview.id,
        }),
      );
    });
  });

  describe('mapDispatchToProps', () => {
    let store;
    let mockApi;
    let dispatch;
    let actions;

    beforeEach(() => {
      store = dispatchSignInActions().store;
      mockApi = sinon.mock(reviewsApi);
      dispatch = sinon.stub();
      actions = mapDispatchToProps(dispatch, {});
    });

    describe('submitReview', () => {
      it('posts the review and dispatches review actions', () => {
        const apiState = store.getState().api;

        const params = {
          score: fakeReview.score,
          apiState: { ...apiState, token: 'new-token' },
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
        const apiState = store.getState().api;

        const versionId = 54321;
        const params = {
          score: fakeReview.score,
          apiState: { ...apiState, token: 'new-token' },
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
        const apiState = store.getState().api;

        const userId = fakeReview.user.id;
        const addonId = fakeReview.addon.id;
        const addonSlug = fakeReview.addon.slug;
        const versionId = fakeReview.version.id;
        mockApi
          .expects('getLatestUserReview')
          .withArgs({
            apiState,
            user: userId,
            addon: addonId,
            version: versionId,
          })
          .returns(Promise.resolve(fakeReview));

        return actions
          .loadSavedReview({
            apiState,
            userId,
            addonId,
            addonSlug,
            versionId,
          })
          .then(() => {
            mockApi.verify();
            sinon.assert.calledWith(dispatch, setReview(fakeReview));
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
});
