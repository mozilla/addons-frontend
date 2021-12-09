import * as React from 'react';
import { shallow } from 'enzyme';

import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
} from 'amo/constants';
import { selectReview } from 'amo/reducers/reviews';
import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  beginDeleteAddonReview,
  createAddonReview,
  createInternalReview,
  deleteAddonReview,
  fetchLatestUserReview,
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
  mapStateToProps,
} from 'amo/components/RatingManager';
import RatingManagerNotice from 'amo/components/RatingManagerNotice';
import ReportAbuseButton from 'amo/components/ReportAbuseButton';
import AuthenticateButton from 'amo/components/AuthenticateButton';
import { genericType, successType } from 'amo/components/Notice';
import UserRating from 'amo/components/UserRating';
import {
  createInternalAddonWithLang,
  createLocalizedString,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function getRenderProps(customProps = {}) {
    return {
      addon: createInternalAddonWithLang(fakeAddon),
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      store: dispatchSignInActions().store,
      userId: 91234,
      version: fakeAddon.current_version,
      ...customProps,
    };
  }

  function render(customProps) {
    const props = getRenderProps(customProps);

    return shallowUntilTarget(<RatingManager {...props} />, RatingManagerBase);
  }

  const createStoreWithLatestReview = ({
    addon = createInternalAddonWithLang({ ...fakeAddon, id: 7663 }),
    review = fakeReview,
    userId = 92345,
  } = {}) => {
    const { store } = dispatchSignInActions({ userId });

    if (review) {
      store.dispatch(setReview(review));
    }
    store.dispatch(
      setLatestReview({
        addonId: addon.id,
        review,
        userId,
      }),
    );

    return { addon, review, userId, store };
  };

  it('prompts you to rate the add-on by name', () => {
    const name = 'Some Add-on';
    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        name: createLocalizedString(name),
      }),
    });

    const prompt = root.find('.RatingManager-legend').html();
    expect(prompt).toContain('How are you enjoying');
    expect(prompt).toContain(name);
  });

  it('dispatches fetchLatestUserReview on construction', () => {
    const userId = 12889;
    const addon = createInternalAddonWithLang({ ...fakeAddon, id: 3344 });

    const { store } = dispatchSignInActions({ userId });
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ addon, store });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchLatestUserReview({
        addonId: addon.id,
        addonSlug: addon.slug,
        errorHandlerId: root.instance().props.errorHandler.id,
        userId,
      }),
    );
  });

  it('does not fetchLatestUserReview when a null one was already fetched', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, id: 3344 });

    const { store } = createStoreWithLatestReview({
      addon,
      // The latest review was already fetched but the result was null.
      review: null,
      userId: 12889,
    });
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ addon, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetchLatestUserReview if there is an error', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, id: 3344 });
    const { store } = dispatchSignInActions();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const errorHandler = createStubErrorHandler(new Error('unexpected error'));

    const props = getRenderProps({
      addon,
      dispatch: store.dispatch,
      errorHandler,
      store,
    });
    const mapped = mapStateToProps(store.getState(), props);

    // This uses shallow() because shallowUntilTarget() cannot handle
    // the <div /> returned from withRenderedErrorHandler().
    // It throws:
    // ShallowWrapper::dive() can not be called on Host Components
    shallow(<RatingManagerBase {...props} {...mapped} />);

    sinon.assert.notCalled(dispatchSpy);
  });

  it('passes review=undefined before the saved review has loaded', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon });
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
    const { addon, store } = createStoreWithLatestReview({
      review: externalReview,
    });
    const root = render({ addon, store });

    const rating = root.find(UserRating);
    expect(rating).toHaveProp('review', createInternalReview(externalReview));
  });

  it('passes review=null when no saved review exists', () => {
    const { addon, store } = createStoreWithLatestReview({ review: null });
    const root = render({ addon, store });

    // This exits the loading state.
    expect(root.find(UserRating)).toHaveProp('review', null);
  });

  it('configures a rating component', () => {
    const { addon, review, store } = createStoreWithLatestReview();

    const root = render({ addon, store });

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
    const addon = createInternalAddonWithLang({ ...fakeAddon });

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
    const { addon, store } = createStoreWithLatestReview();
    const root = render({ addon, store });
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
        addon: createInternalAddonWithLang({ ...fakeAddon, type: addonType }),
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

    it('does not fetchLatestUserReview without a user', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      renderWithoutUser({ store });

      sinon.assert.notCalled(dispatchSpy);
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
      const addon = createInternalAddonWithLang({
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
      const addon = createInternalAddonWithLang({
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
      const { addon, store } = createStoreWithLatestReview({ review });
      const root = render({ addon, store });

      const reviewCard = root.find(AddonReviewCard);
      expect(reviewCard).toHaveProp('review', createInternalReview(review));
    });

    it('shows controls by default', () => {
      const { addon, store } = createStoreWithLatestReview();
      const root = render({ addon, store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', true);
    });

    it('hides controls while showing a saving notification', () => {
      const { addon, store } = createStoreWithLatestReview();

      store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));
      const root = render({ addon, store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', false);
    });

    it('hides controls while showing a saved notification', () => {
      const { addon, store } = createStoreWithLatestReview();

      store.dispatch(flashReviewMessage(SAVED_RATING));
      const root = render({ addon, store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', false);
    });

    it('shows controls when a notification is hidden', () => {
      const { addon, store } = createStoreWithLatestReview();
      // Set a message then hide it.
      store.dispatch(flashReviewMessage(SAVED_RATING));
      store.dispatch(hideFlashedReviewMessage());
      const root = render({ addon, store });

      expect(root.find(AddonReviewCard)).toHaveProp('showControls', true);
    });

    it('hides UserRating and prompt when editing', () => {
      const { addon, review, store } = createStoreWithLatestReview();
      store.dispatch(showEditReviewForm({ reviewId: review.id }));
      const root = render({ addon, store });

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
      const addon = createInternalAddonWithLang(fakeAddon);
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
      const { addon, store } = createStoreWithLatestReview();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const score = 5;

      const root = render({ addon, errorHandler, store });

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
});
