import { shallow } from 'enzyme';
import * as React from 'react';

import {
  deleteAddonReview,
  hideEditReviewForm,
  hideReplyToReviewForm,
  sendReplyToReview,
  setReview,
  setReviewReply,
  showEditReviewForm,
  showReplyToReviewForm,
} from 'amo/actions/reviews';
import AddonReview from 'amo/components/AddonReview';
import AddonReviewManager from 'amo/components/AddonReviewManager';
import AddonReviewCard, {
  AddonReviewCardBase,
} from 'amo/components/AddonReviewCard';
import FlagReviewMenu from 'amo/components/FlagReviewMenu';
import Link from 'amo/components/Link';
import { logOutUser } from 'amo/reducers/users';
import { ALL_SUPER_POWERS } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeReview,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import UserReview from 'ui/components/UserReview';

describe(__filename, () => {
  let store;

  // This is a review with only a rating, no text.
  const fakeRatingOnly = Object.freeze({
    ...fakeReview,
    body: undefined,
    rating: 4,
  });

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      _config: getFakeConfig({ enableFeatureInlineAddonReview: false }),
      addon: createInternalAddon(fakeAddon),
      i18n: fakeI18n(),
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <AddonReviewCard {...props} />,
      AddonReviewCardBase,
    );
  };

  const renderControls = (root) => {
    return shallow(root.find(UserReview).prop('controls'));
  };

  const getReviewFromState = (reviewId) => {
    const review = store.getState().reviews.byId[reviewId];
    expect(review).toBeDefined();
    return review;
  };

  const _setReview = (externalReview) => {
    store.dispatch(setReview(externalReview));
    return getReviewFromState(externalReview.id);
  };

  const _setReviewReply = ({
    addon = fakeAddon,
    replyBody = 'Reply to the review',
  } = {}) => {
    const review = _setReview({
      ...fakeReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
      id: 1,
      body: 'The original review',
      reply: {
        ...fakeReview,
        id: 2,
        body: replyBody,
      },
    });

    return { review, reply: review.reply };
  };

  const renderReply = ({
    addon = createInternalAddon(fakeAddon),
    originalReviewId = 44321,
    reply = _setReviewReply({ addon }).reply,
    ...props
  } = {}) => {
    return render({
      addon,
      review: reply,
      isReplyToReviewId: originalReviewId,
      ...props,
    });
  };

  const signInAndDispatchSavedReview = ({
    siteUserId = 123,
    reviewUserId = siteUserId,
    externalReview = fakeReview,
    reviewUserProps = {},
    clientMetadata = {},
  } = {}) => {
    dispatchSignInActions({ store, userId: siteUserId, ...clientMetadata });
    return _setReview({
      ...externalReview,
      user: {
        ...externalReview.user,
        id: reviewUserId,
        ...reviewUserProps,
      },
    });
  };

  function createAddonAndReview() {
    const addon = createInternalAddon(fakeAddon);
    const review = _setReview({
      ...fakeReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
    });

    return { addon, review };
  }

  const signInAsAddonDeveloper = ({ developerUserId = 51123 } = {}) => {
    dispatchSignInActions({ store, userId: developerUserId });

    const addon = createInternalAddon({
      ...fakeAddon,
      authors: [
        {
          ...fakeAddon.authors[0],
          id: developerUserId,
        },
      ],
    });

    return { addon };
  };

  function createReviewAndSignInAsUnrelatedUser() {
    // Sign in as someone other than the review author.
    return signInAndDispatchSavedReview({
      siteUserId: 123,
      reviewUserId: 987,
    });
  }

  it('renders a review', () => {
    const review = _setReview({
      ...fakeReview,
      id: 1,
      rating: 2,
    });
    const root = render({ review });

    const rating = root.find(UserReview);
    expect(rating).toHaveProp('review', review);
    expect(rating).toHaveProp('showRating', true);
    expect(rating).toHaveProp('byLine');
    expect(rating).toHaveProp('isReply', false);
  });

  it('renders a custom className', () => {
    const className = 'ExampleClassName';
    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

  it('can hide a rating explicitly', () => {
    const root = render({ showRating: false, review: _setReview(fakeReview) });

    const rating = root.find(UserReview);
    expect(rating).toHaveProp('showRating', false);
  });

  it('can hide controls', () => {
    const root = render({
      review: _setReview(fakeReview),
      showControls: false,
    });

    expect(root.find(UserReview)).toHaveProp('controls', null);
  });

  it('renders loading text for falsy reviews', () => {
    const root = render({ review: null });

    expect(root.find(UserReview)).toHaveProp('review', null);
    expect(root.find(UserReview)).toHaveProp('byLine', <LoadingText />);
  });

  it('does not render an edit link when no review exists', () => {
    dispatchSignInActions({ store });
    const root = render({ review: null });

    expect(renderControls(root).find('.AddonReviewCard-edit')).toHaveLength(0);
  });

  it('cannot edit without a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review: null });

    root.instance().onClickToEditReview(createFakeEvent());

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not render edit link when review belongs to another user', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    const root = render({ review });

    expect(renderControls(root).find('.AddonReviewCard-edit')).toHaveLength(0);
  });

  it('does not render edit link even when siteUserCanManageReplies() is true', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    const root = render({
      review,
      _siteUserCanManageReplies: sinon.stub().returns(true),
    });

    expect(renderControls(root).find('.AddonReviewCard-edit')).toHaveLength(0);
  });

  it('renders a delete link for a user review', () => {
    const review = signInAndDispatchSavedReview();
    const root = render({ review });

    const deleteLink = renderControls(root).find('.AddonReviewCard-delete');
    expect(deleteLink).toHaveLength(1);
    expect(deleteLink.children()).toHaveText('Delete review');
    expect(deleteLink).toHaveProp('cancelButtonText', 'Keep review');
    expect(deleteLink).toHaveProp('confirmButtonText', 'Delete review');
  });

  it('renders a delete link for a user rating', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    const root = render({ review });

    const deleteLink = renderControls(root).find('.AddonReviewCard-delete');
    expect(deleteLink).toHaveLength(1);
    expect(deleteLink.children()).toHaveText('Delete rating');
    expect(deleteLink).toHaveProp('cancelButtonText', 'Keep rating');
    expect(deleteLink).toHaveProp('confirmButtonText', 'Delete rating');
  });

  it('does not render delete link when review belongs to another user', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    const root = render({ review });

    expect(renderControls(root).find('.AddonReviewCard-delete')).toHaveLength(
      0,
    );
  });

  it('does not render a delete link even when siteUserCanManageReplies() is true', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    const root = render({
      review,
      _siteUserCanManageReplies: sinon.stub().returns(true),
    });

    expect(renderControls(root).find('.AddonReviewCard-delete')).toHaveLength(
      0,
    );
  });

  it('dispatches deleteReview when a user deletes a review', () => {
    const review = signInAndDispatchSavedReview();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });
    const { errorHandler } = root.instance().props;

    const deleteButton = renderControls(root).find('.AddonReviewCard-delete');
    const deleteEvent = createFakeEvent();

    // This emulates a user clicking the delete button and confirming.
    const onDelete = deleteButton.prop('onConfirm');
    onDelete(deleteEvent);

    sinon.assert.calledOnce(deleteEvent.preventDefault);
    sinon.assert.calledWith(
      dispatchSpy,
      deleteAddonReview({
        addonId: fakeAddon.id,
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  });

  it('renders a deleting message when a user deletes a review', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(
      deleteAddonReview({
        addonId: fakeAddon.id,
        errorHandlerId: createStubErrorHandler().id,
        reviewId: review.id,
      }),
    );

    const root = render({ review });

    const controls = renderControls(root);
    expect(controls.find('.AddonReviewCard-deleting')).toHaveLength(1);
    expect(controls.find('.AddonReviewCard-delete')).toHaveLength(0);
  });

  it('renders a delete link when an error occurs when deleting a review', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(
      deleteAddonReview({
        addonId: fakeAddon.id,
        errorHandlerId: createStubErrorHandler().id,
        reviewId: review.id,
      }),
    );

    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('some unexpected error'));

    const root = render({ errorHandler, review });

    const controls = renderControls(root);
    expect(controls.find('.AddonReviewCard-deleting')).toHaveLength(0);
    expect(controls.find('.AddonReviewCard-delete')).toHaveLength(1);
  });

  it('lets you begin editing your review', () => {
    const review = signInAndDispatchSavedReview();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });

    const editButton = renderControls(root).find('.AddonReviewCard-edit');
    expect(editButton.text()).toContain('Edit review');
    const clickEvent = createFakeEvent();
    editButton.simulate('click', clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.calledWith(
      dispatchSpy,
      showEditReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('does not provide an edit link for ratings', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    const root = render({ review });

    const editButton = renderControls(root).find('.AddonReviewCard-edit');
    expect(editButton).toHaveLength(0);
  });

  it('adds AddonReviewCard-ratingOnly to rating-only reviews', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    const root = render({ review });

    expect(root).toHaveClassName('.AddonReviewCard-ratingOnly');
  });

  it('does not add AddonReviewCard-ratingOnly to reviews with a body', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: {
        ...fakeReview,
        body: 'This is a written review',
      },
    });
    const root = render({ review });

    expect(root).not.toHaveClassName('.AddonReviewCard-ratingOnly');
  });

  it('configures the edit-review form', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(showEditReviewForm({ reviewId: review.id }));

    const root = render({ review });

    const reviewComponent = renderControls(root).find(AddonReview);
    expect(reviewComponent).toHaveLength(1);
    expect(reviewComponent).toHaveProp('review', review);
  });

  it('lets you flag a review', () => {
    const review = _setReview(fakeReview);
    const root = render({ review });

    const flag = renderControls(root).find(FlagReviewMenu);
    expect(flag).toHaveProp('review', review);
    expect(flag).toHaveProp('isDeveloperReply', false);
  });

  it('does not let you flag when declared as non-flaggable', () => {
    const root = render({ flaggable: false, review: _setReview(fakeReview) });

    expect(renderControls(root).find(FlagReviewMenu)).toHaveLength(0);
  });

  it('lets you flag a developer reply', () => {
    const { reply } = _setReviewReply();
    const root = renderReply({ reply });

    const flag = renderControls(root).find(FlagReviewMenu);
    expect(flag).toHaveProp('review', reply);
    expect(flag).toHaveProp('isDeveloperReply', true);
  });

  it('does not let you flag a review before one has loaded', () => {
    const root = render({ review: null });

    expect(root.find(FlagReviewMenu)).toHaveLength(0);
  });

  it('allows review replies when siteUserCanManageReplies() is true', () => {
    dispatchSignInActions({ store });
    const { addon, review } = createAddonAndReview();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({
      addon,
      review,
      _siteUserCanManageReplies: sinon.stub().returns(true),
    });

    const editButton = renderControls(root).find(
      '.AddonReviewCard-begin-reply',
    );
    expect(editButton).toHaveLength(1);

    const clickEvent = createFakeEvent();
    editButton.simulate('click', clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.calledWith(
      fakeDispatch,
      showReplyToReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('disallows review replies when siteUserCanManageReplies() is false', () => {
    dispatchSignInActions({ store });
    const { addon, review } = createAddonAndReview();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({
      addon,
      review,
      _siteUserCanManageReplies: sinon.stub().returns(false),
    });

    expect(
      renderControls(root).find('.AddonReviewCard-begin-reply'),
    ).toHaveLength(0);
    sinon.assert.notCalled(fakeDispatch);
  });

  it('cannot begin a review reply without a review', () => {
    const root = render({ review: null });

    root.instance().onClickToBeginReviewReply(createFakeEvent());
  });

  it('hides reply button when already replying to a review', () => {
    const { addon } = signInAsAddonDeveloper();
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));
    const root = render({ addon, review });

    expect(
      renderControls(root).find('.AddonReviewCard-begin-reply'),
    ).toHaveLength(0);
  });

  it('hides reply button if you wrote the review', () => {
    const developerUserId = 3321;
    const { addon } = signInAsAddonDeveloper({ developerUserId });
    const review = _setReview({
      ...fakeReview,
      user: {
        ...fakeReview.user,
        id: developerUserId,
      },
    });
    const root = render({ addon, review });

    expect(
      renderControls(root).find('.AddonReviewCard-begin-reply'),
    ).toHaveLength(0);
  });

  it('cannot dismiss a review reply without a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review: null });

    root.instance().onDismissReviewReply();

    sinon.assert.notCalled(fakeDispatch);
  });

  it('configures a reply-to-review text form', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const root = render({ review });

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveLength(1);
    expect(textForm).toHaveProp('placeholder', 'Write a reply to this review.');
    expect(textForm).toHaveProp('submitButtonText', 'Publish reply');
    expect(textForm).toHaveProp(
      'submitButtonInProgressText',
      'Publishing reply',
    );
  });

  it('configures a reply-to-review text form when editing', () => {
    const replyBody = 'This is a developer reply';
    const { review } = _setReviewReply({ replyBody });
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const root = render({ review });

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveLength(1);
    expect(textForm).toHaveProp('text', replyBody);
    expect(textForm).toHaveProp('submitButtonText', 'Update reply');
    expect(textForm).toHaveProp('submitButtonInProgressText', 'Updating reply');
  });

  it('configures reply form with null text when no reply exists', () => {
    const review = _setReview({ ...fakeReview, reply: null });
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const root = render({ review });

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveProp('text', null);
  });

  it('dispatches a finish action when dismissing a reply-to-review text form', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review });

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveProp('onDismiss');

    const onDismiss = textForm.prop('onDismiss');
    onDismiss();

    sinon.assert.calledWith(
      fakeDispatch,
      hideReplyToReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('submits the reply-to-review form', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review });
    const { errorHandler } = root.instance().props;

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveProp('onSubmit');

    const onSubmit = textForm.prop('onSubmit');
    const replyBody = 'Body of the review';
    onSubmit({ text: replyBody });

    sinon.assert.calledWith(
      fakeDispatch,
      sendReplyToReview({
        errorHandlerId: errorHandler.id,
        originalReviewId: review.id,
        body: replyBody,
      }),
    );
  });

  it('sets the reply form state when submitting', () => {
    const review = _setReview(fakeReview);

    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));
    store.dispatch(
      sendReplyToReview({
        body: 'A developer reply',
        errorHandlerId: 'some-id',
        originalReviewId: review.id,
      }),
    );

    const root = render({ review });

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveProp('isSubmitting', true);
  });

  it('sets the reply form state when not submitting', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const root = render({ review });

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveProp('isSubmitting', false);
  });

  it('resets the reply form state when there is an error', () => {
    // Simulate submitting a reply that will result in an error.
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));
    store.dispatch(
      sendReplyToReview({
        body: 'A developer reply',
        errorHandlerId: 'some-id',
        originalReviewId: review.id,
      }),
    );

    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('some unexpected error'));

    const root = render({ errorHandler, review });

    const textForm = root.find('.AddonReviewCard-reply-form');
    expect(textForm).toHaveProp('isSubmitting', false);
  });

  it('cannot submit a reply without a review', () => {
    const root = render({ review: null });

    expect(() => {
      root.instance().onSubmitReviewReply({ text: 'some review' });
    }).toThrow(/review property cannot be empty/);
  });

  it('hides the reply-to-review form according to view state', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));
    store.dispatch(hideReplyToReviewForm({ reviewId: review.id }));

    const root = render({ review });

    expect(
      renderControls(root).find('.AddonReviewCard-reply-form'),
    ).toHaveLength(0);
  });

  it('hides the reply-to-review link after a reply has been sent', () => {
    const { addon } = signInAsAddonDeveloper();
    const reviewId = 331;
    _setReview({
      ...fakeReview,
      id: reviewId,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
    });

    store.dispatch(
      setReviewReply({
        originalReviewId: reviewId,
        reply: {
          ...fakeReview,
          id: 431,
          body: 'Some reply to the review',
        },
      }),
    );
    const review = getReviewFromState(reviewId);

    const root = render({ addon, review });

    // This link should be hidden now that a reply has been sent.
    expect(
      renderControls(root).find('.AddonReviewCard-begin-reply'),
    ).toHaveLength(0);
  });

  it('ignores other review related view actions', () => {
    const thisReview = _setReview({ ...fakeReview, id: 1 });
    const anotherReview = _setReview({ ...fakeReview, id: 2 });

    store.dispatch(showReplyToReviewForm({ reviewId: anotherReview.id }));

    const root = render({ review: thisReview });

    expect(
      renderControls(root).find('.AddonReviewCard-reply-form'),
    ).toHaveLength(0);
  });

  it('hides AddonReview when the overlay is escaped', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(showEditReviewForm({ reviewId: review.id }));
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });

    const reviewComponent = renderControls(root).find(AddonReview);
    expect(reviewComponent).toHaveProp('onEscapeOverlay');

    const onEscapeOverlay = reviewComponent.prop('onEscapeOverlay');
    // Simulate escaping the review.
    onEscapeOverlay();

    sinon.assert.calledWith(
      dispatchSpy,
      hideEditReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('cannot escape a review edit form without a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review: null });

    root.instance().onEscapeReviewOverlay();

    sinon.assert.notCalled(fakeDispatch);
  });

  it('hides AddonReview when edit review form is submitted', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(showEditReviewForm({ reviewId: review.id }));
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });

    const reviewComponent = renderControls(root).find(AddonReview);
    expect(reviewComponent).toHaveProp('onReviewSubmitted');

    const onReviewSubmitted = reviewComponent.prop('onReviewSubmitted');
    // Simulate submitting the review.
    onReviewSubmitted();

    sinon.assert.calledWith(
      dispatchSpy,
      hideEditReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('cannot handle submitting a review form without a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review: null });

    root.instance().onReviewSubmitted();

    sinon.assert.notCalled(fakeDispatch);
  });

  it('hides AddonReview after the hide action is dispatched', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(showEditReviewForm({ reviewId: review.id }));
    store.dispatch(hideEditReviewForm({ reviewId: review.id }));
    const root = render({ review });

    expect(renderControls(root).find(AddonReview)).toHaveLength(0);
  });

  it('renders errors', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('unexpected error'));
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  describe('enableFeatureInlineAddonReview', () => {
    function renderInline(otherProps = {}) {
      const _config = getFakeConfig({
        enableFeatureInlineAddonReview: true,
      });
      return render({ _config, ...otherProps });
    }

    it('shows UserReview by default', () => {
      const review = signInAndDispatchSavedReview();
      const root = renderInline({ review });

      expect(root.find(AddonReviewManager)).toHaveLength(0);
      expect(root.find(UserReview)).toHaveLength(1);
    });

    it('renders AddonReviewManager when editing', () => {
      const review = signInAndDispatchSavedReview();
      store.dispatch(showEditReviewForm({ reviewId: review.id }));

      const root = renderInline({ review });

      expect(root.find(UserReview)).toHaveLength(0);
      const manager = root.find(AddonReviewManager);
      expect(manager).toHaveLength(1);
      expect(manager).toHaveProp('review', review);
      expect(manager).toHaveProp('puffyButtons', false);
    });

    it('configures AddonReviewManager with puffyButtons when verticalButtons=true', () => {
      const review = signInAndDispatchSavedReview();
      store.dispatch(showEditReviewForm({ reviewId: review.id }));

      const root = renderInline({ review, verticalButtons: true });

      const manager = root.find(AddonReviewManager);
      expect(manager).toHaveProp('puffyButtons', true);
    });

    it('hides the review form on cancel', () => {
      const review = signInAndDispatchSavedReview();
      store.dispatch(showEditReviewForm({ reviewId: review.id }));
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const root = renderInline({ review });

      const manager = root.find(AddonReviewManager);
      expect(manager).toHaveProp('onCancel');

      dispatchSpy.resetHistory();
      const onCancel = manager.prop('onCancel');
      onCancel();

      sinon.assert.calledWith(
        dispatchSpy,
        hideEditReviewForm({
          reviewId: review.id,
        }),
      );
    });

    it('provides a write review button for ratings', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const review = signInAndDispatchSavedReview({
        externalReview: fakeRatingOnly,
      });
      const root = renderInline({ review });

      const writeReview = root.find('.AddonReviewCard-writeReviewButton');
      expect(writeReview).toHaveLength(1);
      expect(writeReview).toHaveProp('puffy', false);

      dispatchSpy.resetHistory();
      writeReview.simulate('click', createFakeEvent());

      sinon.assert.calledWith(
        dispatchSpy,
        showEditReviewForm({ reviewId: review.id }),
      );
    });

    it('hides the write review button for ratings when not logged in', () => {
      const review = signInAndDispatchSavedReview({
        externalReview: fakeRatingOnly,
      });
      let root = renderInline({ review });

      expect(root.find('.AddonReviewCard-writeReviewButton')).toHaveLength(1);

      store.dispatch(logOutUser());

      root = renderInline({ review });
      expect(root.find('.AddonReviewCard-writeReviewButton')).toHaveLength(0);
    });

    it('hides the write review button if the rating is not by the current user', () => {
      const reviewUserId = 1;
      const loggedInUserId = 2;
      const review = _setReview({
        ...fakeRatingOnly,
        user: {
          ...fakeRatingOnly.user,
          id: reviewUserId,
        },
      });
      dispatchSignInActions({ store, userId: loggedInUserId });

      const root = renderInline({ review });

      expect(root.find('.AddonReviewCard-writeReviewButton')).toHaveLength(0);
    });

    it('can render a larger write review button', () => {
      const review = signInAndDispatchSavedReview({
        externalReview: fakeRatingOnly,
      });
      const root = renderInline({ review, smallerWriteReviewButton: false });

      expect(root.find('.AddonReviewCard-writeReviewButton')).toHaveProp(
        'puffy',
        true,
      );
    });
  });

  describe('byLine', () => {
    function renderByLine(root) {
      return shallow(root.find(UserReview).prop('byLine'));
    }

    it('renders a byLine with a permalink to the review', () => {
      const slug = 'some-slug';
      const review = signInAndDispatchSavedReview({
        externalReview: { ...fakeReview, addon: { ...fakeReview.addon, slug } },
      });
      const root = render({ review, store });

      expect(renderByLine(root).find(Link)).toHaveProp(
        'to',
        `/addon/${slug}/reviews/${review.id}/`,
      );
    });

    it('renders a byLine with a relative date', () => {
      const i18n = fakeI18n();
      const review = signInAndDispatchSavedReview();
      const root = render({ i18n, review });

      expect(
        renderByLine(root)
          .find(Link)
          .children(),
      ).toHaveText(i18n.moment(review.created).fromNow());
    });

    it('renders a byLine with an author by default', () => {
      const name = 'some_user';
      const review = signInAndDispatchSavedReview({
        reviewUserProps: { name },
      });
      const root = render({ review });

      expect(
        renderByLine(root)
          .find('.AddonReviewCard-authorByLine')
          .text(),
      ).toContain(`by ${name},`);
    });

    it('renders a short byLine for replies by default', () => {
      const i18n = fakeI18n();
      const addon = createInternalAddon(fakeAddon);
      const { reply } = _setReviewReply({ addon });

      const root = renderReply({ i18n, reply });

      expect(renderByLine(root).text()).toContain('posted ');
    });

    it('renders a short byLine explicitly', () => {
      const review = _setReview(fakeReview);
      const root = render({ shortByLine: true, review });

      expect(renderByLine(root).text()).toContain('posted ');
    });

    it('builds a byLine string by extracting the timestamp and inserting a link', () => {
      const firstPart = 'this is the first part';
      const lastPart = 'this is the last part';
      const byLineString = `${firstPart} %(timestamp)s ${lastPart}`;
      const i18n = {
        ...fakeI18n(),
        gettext: sinon.stub().returns(byLineString),
      };
      const review = _setReview(fakeReview);
      const root = render({ i18n, shortByLine: true, review });

      expect(
        renderByLine(root)
          .text()
          .startsWith(firstPart),
      ).toBe(true);
      expect(
        renderByLine(root)
          .text()
          .endsWith(lastPart),
      ).toBe(true);
      expect(renderByLine(root).find(Link)).toHaveLength(1);
    });
  });

  describe('Developer reply to a review', () => {
    it('renders a nested reply', () => {
      const addon = createInternalAddon(fakeAddon);
      const { review, reply } = _setReviewReply({ addon });
      const root = render({ addon, review });

      const replyComponent = root.find(AddonReviewCard);
      expect(replyComponent).toHaveLength(1);
      expect(replyComponent).toHaveProp('review', reply);
      expect(replyComponent).toHaveProp('isReplyToReviewId', review.id);
    });

    it('hides rating stars', () => {
      const root = renderReply();

      const rating = root.find(UserReview);
      expect(rating).toHaveProp('showRating', false);
    });

    it('passes isReply to the UserReview', () => {
      const root = renderReply();

      expect(root.find(UserReview)).toHaveProp('isReply', true);
    });

    it('hides rating stars even with showRating=true', () => {
      const root = renderReply({ showRating: true });

      const rating = root.find(UserReview);
      expect(rating).toHaveProp('showRating', false);
    });

    it('hides the reply-to-review link on the developer reply', () => {
      const developerUserId = 3321;
      const { addon } = signInAsAddonDeveloper({ developerUserId });
      const root = renderReply({ addon });
      expect(
        renderControls(root).find('.AddonReviewCard-begin-reply'),
      ).toHaveLength(0);
    });

    it('hides a nested reply when editing it', () => {
      const { review } = _setReviewReply();
      store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

      const root = render({ review });

      const replyComponent = root.find(AddonReviewCard);
      expect(replyComponent).toHaveLength(0);
    });

    it('does not include a user name in the byline', () => {
      const { reply } = _setReviewReply();
      const root = renderReply({ reply });

      expect(root.find('.AddonReviewCard-byline')).not.toIncludeText(
        reply.userName,
      );
    });

    it('shows a form to edit your reply', () => {
      const originalReviewId = 543;
      const developerUserId = 321;
      const review = signInAndDispatchSavedReview({
        siteUserId: developerUserId,
        reviewUserId: developerUserId,
      });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = renderReply({ originalReviewId, reply: review });

      const editButton = renderControls(root).find('.AddonReviewCard-edit');
      expect(editButton.text()).toContain('Edit reply');
      expect(editButton).toHaveLength(1);

      editButton.simulate('click', createFakeEvent());

      sinon.assert.calledWith(
        dispatchSpy,
        showReplyToReviewForm({
          reviewId: originalReviewId,
        }),
      );
    });

    it('lets you edit a reply if siteUserCanManageReplies() is true', () => {
      const review = createReviewAndSignInAsUnrelatedUser();
      const root = renderReply({
        reply: review,
        _siteUserCanManageReplies: sinon.stub().returns(true),
      });

      const editButton = renderControls(root).find('.AddonReviewCard-edit');
      expect(editButton).toHaveLength(1);
    });

    it('renders a delete link for a developer reply', () => {
      const originalReviewId = 543;
      const developerUserId = 321;
      const review = signInAndDispatchSavedReview({
        siteUserId: developerUserId,
        reviewUserId: developerUserId,
      });
      const root = renderReply({ originalReviewId, reply: review });

      const deleteLink = renderControls(root).find('.AddonReviewCard-delete');
      expect(deleteLink).toHaveLength(1);
      expect(deleteLink.children()).toHaveText('Delete reply');
      expect(deleteLink).toHaveProp('cancelButtonText', 'Keep reply');
      expect(deleteLink).toHaveProp('confirmButtonText', 'Delete reply');
    });

    it('renders a delete link when siteUserCanManageReplies() is true', () => {
      const review = createReviewAndSignInAsUnrelatedUser();
      const root = renderReply({
        reply: review,
        _siteUserCanManageReplies: sinon.stub().returns(true),
      });

      const deleteLink = renderControls(root).find('.AddonReviewCard-delete');
      expect(deleteLink).toHaveLength(1);
    });

    it('dispatches deleteReview when a user deletes a developer reply', () => {
      const originalReviewId = 543;
      const developerUserId = 321;
      const review = signInAndDispatchSavedReview({
        siteUserId: developerUserId,
        reviewUserId: developerUserId,
      });
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const root = renderReply({ originalReviewId, reply: review });
      const { errorHandler } = root.instance().props;

      const deleteEvent = createFakeEvent();
      const deleteButton = renderControls(root).find('.AddonReviewCard-delete');
      // This emulates a user clicking the delete button and confirming.
      const onDelete = deleteButton.prop('onConfirm');
      onDelete(deleteEvent);

      sinon.assert.calledOnce(deleteEvent.preventDefault);
      sinon.assert.calledWith(
        dispatchSpy,
        deleteAddonReview({
          addonId: fakeAddon.id,
          errorHandlerId: errorHandler.id,
          reviewId: review.id,
          isReplyToReviewId: originalReviewId,
        }),
      );
    });

    it('renders a non-nested reply', () => {
      const review = _setReview({
        ...fakeReview,
        is_developer_reply: true,
      });
      // Set showRating to true to prove that we will not show a rating for a reply.
      const root = render({ review, showRating: true });

      const reviewComponent = root.find(UserReview);
      expect(reviewComponent).toHaveProp('showRating', false);
    });
  });

  describe('siteUserCanManageReplies', () => {
    it('requires a signed in user', () => {
      dispatchClientMetadata({ store });

      const addon = createInternalAddon(fakeAddon);
      const root = renderReply({ addon });

      expect(root.instance().siteUserCanManageReplies()).toEqual(false);
    });

    it('does not let the wrong user manage replies', () => {
      dispatchSignInActions({ store });

      const addon = createInternalAddon(fakeAddon);
      const root = renderReply({ addon });

      expect(root.instance().siteUserCanManageReplies()).toEqual(false);
    });

    it('lets any admin manage replies', () => {
      dispatchSignInActions({
        store,
        userProps: { permissions: [ALL_SUPER_POWERS] },
      });

      const addon = createInternalAddon(fakeAddon);
      const root = renderReply({ addon });

      expect(root.instance().siteUserCanManageReplies()).toEqual(true);
    });

    it('lets any listed author manage replies', () => {
      const { addon } = signInAsAddonDeveloper();

      const root = renderReply({ addon });

      expect(root.instance().siteUserCanManageReplies()).toEqual(true);
    });
  });
});
