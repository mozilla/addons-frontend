import React from 'react';

import {
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
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata, dispatchSignInActions, fakeAddon, fakeReview,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <AddonReviewListItem {...props} />, AddonReviewListItemBase
    );
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
      authors: [{
        ...fakeAddon.authors[0],
        id: developerUserId,
      }],
    });

    return { addon };
  };

  it('renders a review', () => {
    const root = render({
      review: _setReview({
        ...fakeReview, id: 1, rating: 2,
      }),
    });

    expect(root.find('h3'))
      .toHaveText(fakeReview.title);

    expect(root.find('.AddonReviewListItem-body').html())
      .toContain(fakeReview.body);

    expect(root.find('.AddonReviewListItem-byline'))
      .toIncludeText(fakeReview.user.name);

    const rating = root.find(Rating);
    expect(rating).toHaveProp('rating', 2);
    expect(rating).toHaveProp('readOnly', true);
  });

  it('renders newlines in review bodies', () => {
    const fakeReviewWithNewLine = {
      ...fakeReview,
      body: "It's awesome \n isn't it?",
    };
    const root = render({
      review: _setReview(fakeReviewWithNewLine),
    });

    expect(root.find('p').render().find('br'))
      .toHaveLength(1);
  });

  it('renders loading text for falsy reviews', () => {
    const root = render({ review: null });

    expect(root.find('h3').at(0).find(LoadingText))
      .toHaveLength(1);
    expect(root.find('p').at(0).find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.AddonReviewListItem-byline').at(0)
      .find(LoadingText)).toHaveLength(1);
  });

  it('does not render an edit link when no review exists', () => {
    dispatchSignInActions({ store });
    const root = render({ review: null });

    expect(root.find('.AddonReviewListItem-edit')).toHaveLength(0);
  });

  it('cannot edit without a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review: null });

    root.instance().onClickToEditReview(createFakeEvent());

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not render edit link when review belongs to another user', () => {
    const review = signInAndDispatchSavedReview({
      siteUserId: 123, reviewUserId: 987,
    });
    const root = render({ review });

    expect(root.find('.AddonReviewListItem-edit')).toHaveLength(0);
  });

  it('lets you begin editing your review', () => {
    const review = signInAndDispatchSavedReview();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });

    const editButton = root.find('.AddonReviewListItem-edit');
    const clickEvent = createFakeEvent();
    editButton.simulate('click', clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.calledWith(dispatchSpy, showEditReviewForm({
      reviewId: review.id,
    }));
  });

  it('configures the edit-review form', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(showEditReviewForm({ reviewId: review.id }));
    const root = render({ review });

    const reviewComponent = root.find(AddonReview);
    expect(reviewComponent).toHaveLength(1);
    expect(reviewComponent).toHaveProp('review', review);
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

    const editButton = root.find('.AddonReviewListItem-begin-reply');
    expect(editButton).toHaveLength(1);
    const clickEvent = createFakeEvent();
    editButton.simulate('click', clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.calledWith(fakeDispatch, showReplyToReviewForm({
      reviewId: review.id,
    }));
  });

  it('cannot begin a review reply without a review', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review: null });

    root.instance().onClickToBeginReviewReply(createFakeEvent());

    sinon.assert.notCalled(fakeDispatch);
  });

  it('hides reply button when already replying to a review', () => {
    const { addon } = signInAsAddonDeveloper();
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));
    const root = render({ addon, review });

    expect(root.find('.AddonReviewListItem-begin-reply')).toHaveLength(0);
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

    expect(root.find('.AddonReviewListItem-begin-reply')).toHaveLength(0);
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
    expect(textForm)
      .toHaveProp('placeholder', 'Write a reply to this review.');
    expect(textForm)
      .toHaveProp('submitButtonText', 'Publish reply');
    expect(textForm)
      .toHaveProp('submitButtonInProgressText', 'Publishing reply');
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

    sinon.assert.calledWith(fakeDispatch, hideReplyToReviewForm({
      reviewId: review.id,
    }));
  });

  it('submits the reply-to-review form', () => {
    const review = _setReview(fakeReview);
    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ review });
    const errorHandler = root.instance().props.errorHandler;

    const textForm = root.find('.AddonReviewListItem-reply-form');
    expect(textForm).toHaveProp('onSubmit');

    const onSubmit = textForm.prop('onSubmit');
    const replyBody = 'Body of the review';
    onSubmit({ text: replyBody });

    sinon.assert.calledWith(fakeDispatch, sendReplyToReview({
      errorHandlerId: errorHandler.id,
      originalReviewId: review.id,
      body: replyBody,
    }));
  });

  it('sets the reply form state when submitting', () => {
    const review = _setReview(fakeReview);

    store.dispatch(showReplyToReviewForm({ reviewId: review.id }));
    store.dispatch(sendReplyToReview({
      body: 'A developer reply',
      errorHandlerId: 'some-id',
      originalReviewId: review.id,
    }));

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

    expect(root.find('.AddonReviewListItem-reply-form')).toHaveLength(0);
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

    store.dispatch(setReviewReply({
      originalReviewId: reviewId,
      reply: {
        ...fakeReview,
        id: 431,
        body: 'Some reply to the review',
      },
    }));
    const review = getReviewFromState(reviewId);

    const root = render({ addon, review });

    // This link should be hidden now that a reply has been sent.
    expect(root.find('.AddonReviewListItem-begin-reply')).toHaveLength(0);
  });

  it('ignores other review related view actions', () => {
    const thisReview = _setReview({ ...fakeReview, id: 1 });
    const anotherReview = _setReview({ ...fakeReview, id: 2 });

    store.dispatch(showReplyToReviewForm({ reviewId: anotherReview.id }));

    const root = render({ review: thisReview });

    expect(root.find('.AddonReviewListItem-reply-form')).toHaveLength(0);
  });

  it('hides AddonReview when the overlay is escaped', () => {
    const review = signInAndDispatchSavedReview();
    store.dispatch(showEditReviewForm({ reviewId: review.id }));
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ review });

    const reviewComponent = root.find(AddonReview);
    expect(reviewComponent).toHaveProp('onEscapeOverlay');

    const onEscapeOverlay = reviewComponent.prop('onEscapeOverlay');
    // Simulate escaping the review.
    onEscapeOverlay();

    sinon.assert.calledWith(dispatchSpy, hideEditReviewForm({
      reviewId: review.id,
    }));
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

    const reviewComponent = root.find(AddonReview);
    expect(reviewComponent).toHaveProp('onReviewSubmitted');

    const onReviewSubmitted = reviewComponent.prop('onReviewSubmitted');
    // Simulate submitting the review.
    onReviewSubmitted();

    sinon.assert.calledWith(dispatchSpy, hideEditReviewForm({
      reviewId: review.id,
    }));
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

    expect(root.find(AddonReview)).toHaveLength(0);
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
    const _setReviewReply = ({ addon = fakeAddon } = {}) => {
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
          body: 'Reply to the review',
        },
      });

      return { review, reply: review.reply };
    };

    const renderReply = ({
      addon = createInternalAddon(fakeAddon),
      reply = _setReviewReply({ addon }).reply,
      ...props
    } = {}) => {
      return render({
        addon,
        review: reply,
        isReply: true,
        ...props,
      });
    };

    it('sets a reply class name', () => {
      const root = renderReply();

      expect(root).toHaveClassName('AddonReviewListItem-reply');
    });

    it('renders a nested reply', () => {
      const addon = createInternalAddon(fakeAddon);
      const { review, reply } = _setReviewReply({ addon });
      const root = render({ addon, review });

      const replyComponent = root.find(AddonReviewListItem);
      expect(replyComponent).toHaveLength(1);
      expect(replyComponent).toHaveProp('addon', addon);
      expect(replyComponent).toHaveProp('review', reply);
      expect(replyComponent).toHaveProp('isReply', true);
    });

    it('hides ratings for replies', () => {
      const root = renderReply();

      expect(root.find(Rating)).toHaveLength(0);
    });

    it('does not include a user name in the byline', () => {
      const { reply } = _setReviewReply();
      const root = renderReply({ reply });

      expect(root.find('.AddonReviewListItem-byline'))
        .not.toIncludeText(reply.userName);
    });

    it('hides the edit button for replies', () => {
      const developerUserId = 321;
      const review = signInAndDispatchSavedReview({
        siteUserId: developerUserId, reviewUserId: developerUserId,
      });
      const root = renderReply({ reply: review });

      expect(root.find('.AddonReviewListItem-edit')).toHaveLength(0);
    });

    it('adds a header', () => {
      const root = renderReply();

      const header = root.find('.AddonReviewListItem-reply-header');
      expect(header).toHaveLength(1);
      expect(header.find(Icon)).toHaveProp('name', 'reply-arrow');
    });
  });
});
