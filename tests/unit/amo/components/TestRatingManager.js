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
import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  beginDeleteAddonReview,
  createAddonReview,
  createInternalReview,
  deleteAddonReview,
  flashReviewMessage,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  setLatestReview,
  setReview,
  showEditReviewForm,
  updateAddonReview,
} from 'amo/actions/reviews';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonReviewManagerRating from 'amo/components/AddonReviewManagerRating';
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
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render(customProps = {}) {
    const props = {
      addon: createInternalAddon(fakeAddon),
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      loadSavedReview: () => Promise.resolve(),
      store: dispatchSignInActions().store,
      userId: 91234,
      version: fakeAddon.current_version,
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

    return { addon, review, userId, versionId, store };
  };

  it('prompts you to rate the add-on by name', () => {
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, name: 'Some Add-on' }),
    });

    const prompt = root.find('.RatingManager-legend').html();
    expect(prompt).toContain('How are you enjoying');
    expect(prompt).toContain('Some Add-on');
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
    const addon = createInternalAddon({ ...fakeAddon, id: 3344 });
    const version = {
      ...fakeAddon.current_version,
      id: 9966,
    };
    const loadSavedReview = sinon.spy();

    const { store } = createStoreWithLatestReview({
      addon,
      review: null,
      userId: 12889,
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
    const { store } = createStoreWithLatestReview({ review: externalReview });
    const root = render({ store });

    const rating = root.find(UserRating);
    expect(rating).toHaveProp('review', createInternalReview(externalReview));
  });

  it('passes review=null when no saved review exists', () => {
    const { store } = createStoreWithLatestReview({ review: null });
    const root = render({ store });

    // This exits the loading state.
    expect(root.find(UserRating)).toHaveProp('review', null);
  });

  it('configures a rating component', () => {
    const { review, store } = createStoreWithLatestReview();

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
    const { store } = createStoreWithLatestReview();
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

    it('configures UserRating when signed out', async () => {
      const root = renderWithoutUser();

      const rating = root.find(UserRating);
      expect(rating).toHaveLength(1);
      expect(rating).toHaveProp('readOnly', true);
      expect(rating).toHaveProp('review', null);
    });

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

  describe('inline features', () => {
    it('configures AddonReviewManagerRating when beginningToDeleteReview', () => {
      const review = { ...fakeReview, score: 4 };
      const { addon, userId, store } = createStoreWithLatestReview({ review });
      store.dispatch(beginDeleteAddonReview({ reviewId: review.id }));

      const root = render({ store, addon, userId });

      expect(root.find(UserRating)).toHaveLength(0);

      const managerRating = root.find(AddonReviewManagerRating);
      expect(managerRating).toHaveLength(1);
      expect(managerRating).toHaveProp('rating', review.score);
    });

    it('also configures AddonReviewManagerRating while deletingReview', () => {
      const { addon, review, userId, store } = createStoreWithLatestReview();
      store.dispatch(
        deleteAddonReview({
          addonId: addon.id,
          errorHandlerId: 'some-error-handler',
          reviewId: review.id,
        }),
      );

      const root = render({ store, addon, userId });

      expect(root.find(UserRating)).toHaveLength(0);
      expect(root.find(AddonReviewManagerRating)).toHaveLength(1);
    });

    it('prompts to delete a review when beginningToDeleteReview', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        name: 'uBlock Origin',
      });
      const review = { ...fakeReview, body: 'This add-on is nice' };
      const { userId, store } = createStoreWithLatestReview({ addon, review });
      store.dispatch(beginDeleteAddonReview({ reviewId: review.id }));

      const root = render({ store, addon, userId });

      const prompt = root.find('.RatingManager-legend').html();
      expect(prompt).toContain('Are you sure you want to delete your review');
      expect(prompt).toContain(addon.name);
    });

    it('prompts to delete a rating when beginningToDeleteReview', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        name: 'uBlock Origin',
      });
      const review = { ...fakeReview, body: undefined, score: 4 };
      const { userId, store } = createStoreWithLatestReview({ addon, review });
      store.dispatch(beginDeleteAddonReview({ reviewId: review.id }));

      const root = render({ store, addon, userId });

      const prompt = root.find('.RatingManager-legend').html();
      expect(prompt).toContain('Are you sure you want to delete your rating');
      expect(prompt).toContain(addon.name);
    });

    it('still prompts to delete a review while deletingReview', () => {
      const { addon, review, userId, store } = createStoreWithLatestReview();
      store.dispatch(
        deleteAddonReview({
          addonId: addon.id,
          errorHandlerId: 'some-error-handler',
          reviewId: review.id,
        }),
      );

      const root = render({ store, addon, userId });

      const prompt = root.find('.RatingManager-legend').html();
      expect(prompt).toContain('Are you sure you want to delete your review');
    });

    it('shows AddonReviewCard with a saved review', () => {
      const review = {
        ...fakeReview,
        body: 'This is hands down the best ad blocker',
      };
      const root = render({
        store: createStoreWithLatestReview({ review }).store,
      });

      const reviewCard = root.find(AddonReviewCard);
      expect(reviewCard).toHaveProp('review', createInternalReview(review));
    });

    it('shows controls by default', () => {
      const root = render({
        store: createStoreWithLatestReview().store,
      });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', true);
    });

    it('hides controls while showing a saving notification', () => {
      const { store } = createStoreWithLatestReview();

      store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));
      const root = render({ store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', false);
    });

    it('hides controls while showing a saved notification', () => {
      const { store } = createStoreWithLatestReview();

      store.dispatch(flashReviewMessage(SAVED_RATING));
      const root = render({ store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', false);
    });

    it('shows controls when a notification is hidden', () => {
      const { store } = createStoreWithLatestReview();
      // Set a message then hide it.
      store.dispatch(flashReviewMessage(SAVED_RATING));
      store.dispatch(hideFlashedReviewMessage());
      const root = render({ store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', true);
    });

    it('hides UserRating and prompt when editing', () => {
      const { review, store } = createStoreWithLatestReview();
      store.dispatch(showEditReviewForm({ reviewId: review.id }));
      const root = render({ store });

      expect(root.find('.RatingManager-legend')).toHaveLength(0);
      expect(root.find(UserRating)).toHaveLength(0);
    });

    it('shows UserRating and prompt when not editing', () => {
      const { review, store } = createStoreWithLatestReview();

      store.dispatch(showEditReviewForm({ reviewId: review.id }));
      store.dispatch(hideEditReviewForm({ reviewId: review.id }));

      const root = render({ store });

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

      const root = render({ addon, errorHandler, store, version });

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
      const { store } = createStoreWithLatestReview();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const score = 5;

      const root = render({ errorHandler, store });

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

    it('does not update an existing review if its version does not match', () => {
      // Set up a situation where the user is viewing a new version
      // but their latest saved review is for an older version.
      const oldVersionId = 1;
      const newVersionId = 2;

      const addon = createInternalAddon({
        ...fakeAddon,
        id: 7741,
        current_version: {
          ...fakeAddon.current_version,
          id: newVersionId,
        },
      });

      const { store } = createStoreWithLatestReview({
        addon,
        review: { ...fakeReview },
        versionId: oldVersionId,
      });
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const root = render({ addon, store, version: addon.current_version });

      // This emulates clicking on a rating star.
      const score = 4;
      root.find(UserRating).prop('onSelectRating')(score);

      sinon.assert.calledWith(
        dispatchSpy,
        // Make sure a new review is created against the current version.
        createAddonReview({
          addonId: addon.id,
          errorHandlerId: root.instance().props.errorHandler.id,
          score,
          versionId: newVersionId,
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
