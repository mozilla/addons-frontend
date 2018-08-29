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
import AddonReviewListItem, {
  AddonReviewListItemBase,
} from 'amo/components/AddonReviewListItem';
import FlagReviewMenu from 'amo/components/FlagReviewMenu';
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
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import UserReview from 'ui/components/UserReview';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      location: createFakeLocation(),
      i18n: fakeI18n(),
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <AddonReviewListItem {...props} />,
      AddonReviewListItemBase,
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
  } = {}) => {
    dispatchSignInActions({ store, userId: siteUserId });
    return _setReview({
      ...externalReview,
      user: {
        ...externalReview.user,
        id: reviewUserId,
      },
    });
  };

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
  });

  it('renders loading text for falsy reviews', () => {
    const root = render({ review: null });

    expect(root.find(UserReview)).toHaveProp('review', null);
    expect(root.find(UserReview)).toHaveProp('byLine', <LoadingText />);
  });

  it('does not render an edit link when no review exists', () => {
    dispatchSignInActions({ store });
    const root = render({ review: null });

    expect(renderControls(root).find('.AddonReviewListItem-edit')).toHaveLength(
      0,
    );
  });

  it('cannot edit without a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review: null });

    root.instance().onClickToEditReview(createFakeEvent());

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not render edit link when review belongs to another user', () => {
    const review = signInAndDispatchSavedReview({
      siteUserId: 123,
      reviewUserId: 987,
    });
    const root = render({ review });

    expect(renderControls(root).find('.AddonReviewListItem-edit')).toHaveLength(
      0,
    );
  });

  it('renders a delete link for a user review', () => {
    const review = signInAndDispatchSavedReview();
    const root = render({ review });

    const deleteLink = renderControls(root).find('.AddonReviewListItem-delete');
    expect(deleteLink).toHaveLength(1);
    expect(deleteLink.children()).toHaveText('Delete my review');
    expect(deleteLink).toHaveProp(
      'message',
      'Do you really want to delete this review?',
    );
  });

  it('does not render delete link when review belongs to another user', () => {
    const review = signInAndDispatchSavedReview({
      siteUserId: 123,
      reviewUserId: 987,
    });
    const root = render({ review });

    expect(
      renderControls(root).find('.AddonReviewListItem-delete'),
    ).toHaveLength(0);
  });

  it('dispatches deleteReview when a user deletes a review', () => {
    const review = signInAndDispatchSavedReview();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });
    const { errorHandler } = root.instance().props;

    const deleteButton = renderControls(root).find(
      '.AddonReviewListItem-delete',
    );
    const deleteEvent = createFakeEvent();

    // This emulates a user clicking the delete button and confirming.
    const onDelete = deleteButton.prop('onConfirm');
    onDelete(deleteEvent);

    sinon.assert.calledOnce(deleteEvent.preventDefault);
    sinon.assert.calledWith(
      dispatchSpy,
      deleteAddonReview({
        errorHandlerId: errorHandler.id,
        reviewId: review.id,
      }),
    );
  });

  it('renders a deleting message when a user deletes a review', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(
      deleteAddonReview({
        errorHandlerId: createStubErrorHandler().id,
        reviewId: review.id,
      }),
    );

    const root = render({ review });

    const controls = renderControls(root);
    expect(controls.find('.AddonReviewListItem-deleting')).toHaveLength(1);
    expect(controls.find('.AddonReviewListItem-delete')).toHaveLength(0);
  });

  it('lets you begin editing your review', () => {
    const review = signInAndDispatchSavedReview();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });

    const editButton = renderControls(root).find('.AddonReviewListItem-edit');
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
    const location = createFakeLocation();
    const root = render({ location, review });

    const flag = renderControls(root).find(FlagReviewMenu);
    expect(flag).toHaveProp('review', review);
    expect(flag).toHaveProp('location', location);
    expect(flag).toHaveProp('isDeveloperReply', false);
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

  it('lets the developer reply to a review', () => {
    const { addon } = signInAsAddonDeveloper();
    const review = _setReview({
      ...fakeReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
    });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ addon, review });

    const editButton = renderControls(root).find(
      '.AddonReviewListItem-begin-reply',
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

  it('lets an admin reply to a review', () => {
    dispatchSignInActions({
      store,
      userProps: { permissions: [ALL_SUPER_POWERS] },
    });

    const addon = createInternalAddon(fakeAddon);
    const review = _setReview({
      ...fakeReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
    });

    const root = render({ addon, review });

    expect(
      renderControls(root).find('.AddonReviewListItem-begin-reply'),
    ).toHaveLength(1);
  });

  it('does not let a regular user reply to a review', () => {
    dispatchSignInActions({ store });

    const addon = createInternalAddon(fakeAddon);
    const review = _setReview({
      ...fakeReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
    });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ addon, review });

    expect(
      renderControls(root).find('.AddonReviewListItem-begin-reply'),
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
      renderControls(root).find('.AddonReviewListItem-begin-reply'),
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
      renderControls(root).find('.AddonReviewListItem-begin-reply'),
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

    const textForm = root.find('.AddonReviewListItem-reply-form');
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

    const textForm = root.find('.AddonReviewListItem-reply-form');
    expect(textForm).toHaveLength(1);
    expect(textForm).toHaveProp('text', replyBody);
    expect(textForm).toHaveProp('submitButtonText', 'Update reply');
    expect(textForm).toHaveProp('submitButtonInProgressText', 'Updating reply');
  });

  it('configures reply form with null text when no reply exists', () => {
    const review = _setReview({ ...fakeReview, reply: null });
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const root = render({ review });

    const textForm = root.find('.AddonReviewListItem-reply-form');
    expect(textForm).toHaveProp('text', null);
  });

  it('dispatches a finish action when dismissing a reply-to-review text form', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review });

    const textForm = root.find('.AddonReviewListItem-reply-form');
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

    const textForm = root.find('.AddonReviewListItem-reply-form');
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

    const textForm = root.find('.AddonReviewListItem-reply-form');
    expect(textForm).toHaveProp('isSubmitting', true);
  });

  it('sets the reply form state when not submitting', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const root = render({ review });

    const textForm = root.find('.AddonReviewListItem-reply-form');
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

    const textForm = root.find('.AddonReviewListItem-reply-form');
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
      renderControls(root).find('.AddonReviewListItem-reply-form'),
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
      renderControls(root).find('.AddonReviewListItem-begin-reply'),
    ).toHaveLength(0);
  });

  it('ignores other review related view actions', () => {
    const thisReview = _setReview({ ...fakeReview, id: 1 });
    const anotherReview = _setReview({ ...fakeReview, id: 2 });

    store.dispatch(showReplyToReviewForm({ reviewId: anotherReview.id }));

    const root = render({ review: thisReview });

    expect(
      renderControls(root).find('.AddonReviewListItem-reply-form'),
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

  describe('Developer reply to a review', () => {
    it('renders a nested reply', () => {
      const addon = createInternalAddon(fakeAddon);
      const { review, reply } = _setReviewReply({ addon });
      const root = render({ addon, review });

      const replyComponent = root.find(AddonReviewListItem);
      expect(replyComponent).toHaveLength(1);
      expect(replyComponent).toHaveProp('addon', addon);
      expect(replyComponent).toHaveProp('review', reply);
      expect(replyComponent).toHaveProp('isReplyToReviewId', review.id);
    });

    it('hides the reply-to-review link on the developer reply', () => {
      const developerUserId = 3321;
      const { addon } = signInAsAddonDeveloper({ developerUserId });
      const root = renderReply({ addon });
      expect(
        renderControls(root).find('.AddonReviewListItem-begin-reply'),
      ).toHaveLength(0);
    });

    it('hides a nested reply when editing it', () => {
      const { review } = _setReviewReply();
      store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

      const root = render({ review });

      const replyComponent = root.find(AddonReviewListItem);
      expect(replyComponent).toHaveLength(0);
    });

    it('does not include a user name in the byline', () => {
      const { reply } = _setReviewReply();
      const root = renderReply({ reply });

      expect(root.find('.AddonReviewListItem-byline')).not.toIncludeText(
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

      const editButton = renderControls(root).find('.AddonReviewListItem-edit');
      expect(editButton.text()).toContain('Edit my reply');
      expect(editButton).toHaveLength(1);

      editButton.simulate('click', createFakeEvent());

      sinon.assert.calledWith(
        dispatchSpy,
        showReplyToReviewForm({
          reviewId: originalReviewId,
        }),
      );
    });

    it('renders a delete link for a developer reply', () => {
      const originalReviewId = 543;
      const developerUserId = 321;
      const review = signInAndDispatchSavedReview({
        siteUserId: developerUserId,
        reviewUserId: developerUserId,
      });
      const root = renderReply({ originalReviewId, reply: review });

      const deleteLink = renderControls(root).find(
        '.AddonReviewListItem-delete',
      );
      expect(deleteLink).toHaveLength(1);
      expect(deleteLink.children()).toHaveText('Delete my reply');
      expect(deleteLink).toHaveProp(
        'message',
        'Do you really want to delete this reply?',
      );
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
      const deleteButton = renderControls(root).find(
        '.AddonReviewListItem-delete',
      );
      // This emulates a user clicking the delete button and confirming.
      const onDelete = deleteButton.prop('onConfirm');
      onDelete(deleteEvent);

      sinon.assert.calledOnce(deleteEvent.preventDefault);
      sinon.assert.calledWith(
        dispatchSpy,
        deleteAddonReview({
          errorHandlerId: errorHandler.id,
          reviewId: review.id,
          isReplyToReviewId: originalReviewId,
        }),
      );
    });

    it('adds a developer response header to reply forms', () => {
      const { review } = _setReviewReply();
      store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

      const root = render({ review });

      const formContainer = root.find('.AddonReviewListItem-reply');
      expect(formContainer).toHaveLength(1);
      expect(
        formContainer.find('.AddonReviewListItem-reply-header'),
      ).toHaveLength(1);

      const icon = formContainer.find(Icon);
      expect(icon).toHaveProp('name', 'reply-arrow');

      expect(
        formContainer.find('.AddonReviewListItem-reply-form'),
      ).toHaveLength(1);
    });
  });
});
