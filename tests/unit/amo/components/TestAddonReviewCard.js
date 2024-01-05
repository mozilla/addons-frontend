import * as React from 'react';
import { createEvent, fireEvent, waitFor } from '@testing-library/react';
import defaultUserEvent, {
  PointerEventsCheckLevel,
} from '@testing-library/user-event';

import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  STARTED_SAVE_REVIEW,
  beginDeleteAddonReview,
  cancelDeleteAddonReview,
  createInternalReview,
  deleteAddonReview,
  flashReviewMessage,
  hideEditReviewForm,
  hideFlashedReviewMessage,
  hideReplyToReviewForm,
  sendReplyToReview,
  setReview,
  showEditReviewForm,
  showReplyToReviewForm,
  updateAddonReview,
} from 'amo/actions/reviews';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import { extractId as addonReviewManagerExtractId } from 'amo/components/AddonReviewManager';
import { ALL_SUPER_POWERS } from 'amo/constants';
import { reviewListURL } from 'amo/reducers/reviews';
import { logOutUser } from 'amo/reducers/users';
import {
  createFailedErrorHandler,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAddon,
  fakeI18n,
  fakeReview,
  render as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let i18n;
  let store;
  let userEvent;

  // This is a review with only a rating, no text.
  const fakeRatingOnly = Object.freeze({
    ...fakeReview,
    body: undefined,
    rating: 4,
  });

  beforeEach(() => {
    i18n = fakeI18n();
    store = dispatchClientMetadata().store;
    userEvent = defaultUserEvent.setup({
      delay: null,
      // This is needed for one test which was triggering a library error about
      // pointer events not being available.
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = ({
    addon = createInternalAddonWithLang(fakeAddon),
    location,
    siteUserCanReply = false,
    ...props
  } = {}) => {
    return defaultRender(
      <AddonReviewCard
        addon={addon}
        siteUserCanReply={siteUserCanReply}
        {...props}
      />,
      { store },
    );
  };

  const getReviewFromState = (reviewId) => {
    const review = store.getState().reviews.byId[reviewId];
    expect(review).toBeDefined();
    return review;
  };

  const _setReview = ({ id = fakeReview.id, ...props } = {}) => {
    store.dispatch(setReview({ ...fakeReview, id, ...props }));
    return getReviewFromState(id);
  };

  const _setReviewReply = ({
    addon = fakeAddon,
    replyBody = 'This is the reply to the review',
    replyId = 2,
    replyUserId = 987,
    replyUserName = 'Bob',
    reviewBody = 'This is the review',
    reviewId = 1,
    reviewUserId = 123,
    reviewUserName = 'Daniel',
  } = {}) => {
    const reply = _setReview({
      ...fakeReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
      body: replyBody,
      id: replyId,
      is_developer_reply: true,
      user: { id: replyUserId, name: replyUserName },
    });

    const review = _setReview({
      ...fakeReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
      id: reviewId,
      body: reviewBody,
      reply: {
        ...fakeReview,
        addon: {
          id: addon.id,
          slug: addon.slug,
        },
        body: replyBody,
        id: replyId,
        is_developer_reply: true,
        user: { id: replyUserId, name: replyUserName },
      },
      user: { id: reviewUserId, name: reviewUserName },
    });

    return { review, reply };
  };

  const renderReply = ({
    addon,
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
    dispatchSignInActionsWithStore({
      store,
      userId: siteUserId,
      ...clientMetadata,
    });
    return _setReview({
      ...externalReview,
      user: {
        ...externalReview.user,
        id: reviewUserId,
        ...reviewUserProps,
      },
    });
  };

  function createAddonAndReview({ externalReview = fakeReview } = {}) {
    const addon = createInternalAddonWithLang(fakeAddon);
    const review = _setReview({
      ...externalReview,
      addon: {
        id: addon.id,
        slug: addon.slug,
      },
    });

    return { addon, review };
  }

  const signInAsAddonDeveloper = ({ developerUserId = 51123 } = {}) => {
    dispatchSignInActionsWithStore({ store, userId: developerUserId });

    const addon = createInternalAddonWithLang({
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

  const renderNestedReply = ({
    addon = fakeAddon,
    replyUserId = 2,
    replyUserName = 'Bob',
    reviewUserId = 1,
    reviewUserName = 'Daniel',
    siteUserCanReply = true,
    slim = false,
  } = {}) => {
    const { reply, review } = _setReviewReply({
      addon,
      replyUserId,
      replyUserName,
      reviewUserId,
      reviewUserName,
    });

    render({ addon, review, siteUserCanReply, slim });
    return { reply, review };
  };

  const renderNestedReplyForSignedInDeveloper = ({
    replyUserName = 'Bob',
    reviewUserName = 'Daniel',
    slim = false,
  } = {}) => {
    const originalReviewUserId = 123;
    const developerUserId = 321;
    const { addon } = signInAsAddonDeveloper({ developerUserId });
    return renderNestedReply({
      addon,
      replyUserId: developerUserId,
      replyUserName,
      reviewUserId: originalReviewUserId,
      reviewUserName,
      slim,
    });
  };

  const clickDeleteRating = async () =>
    userEvent.click(screen.getByRole('button', { name: 'Delete rating' }));

  const clickDeleteReview = async () =>
    userEvent.click(screen.getByRole('button', { name: 'Delete review' }));

  const clickEditReply = async () =>
    userEvent.click(screen.getByRole('link', { name: 'Edit reply' }));

  const clickEditReview = async () =>
    userEvent.click(screen.getByRole('link', { name: 'Edit review' }));

  const clickReplyToReview = async () =>
    userEvent.click(screen.getByRole('link', { name: 'Reply to this review' }));

  const getDefaultErrorHandlerId = (reviewId) => `AddonReviewCard-${reviewId}`;

  it('renders a review', () => {
    const body = 'Some review body text';
    render({ review: _setReview({ body, score: 2 }) });

    expect(screen.getByText(body)).toBeInTheDocument();
    expect(screen.getAllByTitle('Rated 2 out of 5')).toHaveLength(6);
  });

  it('renders a custom className', () => {
    const className = 'ExampleClassName';
    render({ className });

    expect(screen.getByClassName('AddonReviewCard')).toHaveClass(className);
  });

  it('can hide a rating explicitly', () => {
    render({ showRating: false, review: _setReview() });

    expect(screen.queryByClassName('Rating')).not.toBeInTheDocument();
  });

  it('can hide controls', () => {
    render({
      review: _setReview(),
      showControls: false,
    });

    expect(
      screen.queryByRole('button', { description: 'Flag this review' }),
    ).not.toBeInTheDocument();
  });

  it('does not render edit link even when siteUserCanReply is true', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    render({
      review,
      siteUserCanReply: true,
    });

    expect(
      screen.queryByRole('link', { name: 'Edit review' }),
    ).not.toBeInTheDocument();
  });

  it('does not render an edit link for ratings', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    render({ review });

    expect(
      screen.queryByRole('link', { name: 'Edit review' }),
    ).not.toBeInTheDocument();
  });

  it('does not render edit link when the review belongs to another user', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    render({ review });

    expect(
      screen.queryByRole('link', { name: 'Edit review' }),
    ).not.toBeInTheDocument();
  });

  it('does not render any controls when beginningToDeleteReview', async () => {
    const review = signInAndDispatchSavedReview();
    render({ review });

    await clickDeleteReview();

    expect(
      screen.queryByRole('link', { name: 'Edit review' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete review' }),
    ).not.toBeInTheDocument();
  });

  it('renders a privileged notice for deleted review', () => {
    const review = _setReview({ is_deleted: true });
    render({ review });

    expect(
      screen.getByText(
        'This rating or review has been deleted. You are only seeing it because of elevated permissions.',
      ),
    ).toBeInTheDocument();
  });

  it('lets you begin editing your review', () => {
    const review = signInAndDispatchSavedReview();
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ review });

    const button = screen.getByRole('link', {
      name: 'Edit review',
    });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      showEditReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('renders a delete link for a user rating', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    render({ review });

    expect(
      screen.getByRole('button', { name: 'Delete rating' }),
    ).toBeInTheDocument();
  });

  it('renders a delete link for a user review', () => {
    const review = signInAndDispatchSavedReview();
    render({ review });

    expect(
      screen.getByRole('button', { name: 'Delete review' }),
    ).toBeInTheDocument();
  });

  it('does not render delete link when the review belongs to another user', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    render({ review });

    expect(
      screen.queryByRole('button', { name: 'Delete review' }),
    ).not.toBeInTheDocument();
  });

  it('does not render a delete link even when siteUserCanReply is true', () => {
    const review = createReviewAndSignInAsUnrelatedUser();
    render({
      review,
      siteUserCanReply: true,
    });

    expect(
      screen.queryByRole('button', { name: 'Delete review' }),
    ).not.toBeInTheDocument();
  });

  it('begins deleting when clicking a delete link for a review', () => {
    const review = signInAndDispatchSavedReview();
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ review });

    const button = screen.getByRole('button', {
      name: 'Delete review',
    });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      beginDeleteAddonReview({
        reviewId: review.id,
      }),
    );
  });

  it('renders generic delete confirmation buttons', async () => {
    const review = signInAndDispatchSavedReview();
    render({ review });

    await clickDeleteReview();

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders delete confirmation buttons for a rating with slim=true', async () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    render({ review, slim: true });

    await clickDeleteRating();

    expect(
      screen.getByRole('button', { name: 'Keep rating' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete rating' }),
    ).toBeInTheDocument();
  });

  it('renders delete confirmation buttons for a review with slim=true', async () => {
    const review = signInAndDispatchSavedReview();
    render({ review, slim: true });

    await clickDeleteReview();

    expect(
      screen.getByRole('button', { name: 'Keep review' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete review' }),
    ).toBeInTheDocument();
  });

  it('does not render a confirmation message for slim=true', async () => {
    const review = signInAndDispatchSavedReview();
    render({ review, slim: true });

    await clickDeleteReview();

    expect(
      screen.queryByText('Do you really want to delete this review?'),
    ).not.toBeInTheDocument();
  });

  it('renders a confirmation prompt for deleting a review', async () => {
    const review = signInAndDispatchSavedReview();
    render({ review });

    await clickDeleteReview();

    expect(
      screen.getByText('Do you really want to delete this review?'),
    ).toBeInTheDocument();
  });

  it('renders a confirmation prompt for deleting a rating', async () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    render({ review });

    await clickDeleteRating();

    expect(
      screen.getByText('Do you really want to delete this rating?'),
    ).toBeInTheDocument();
  });

  it('lets you cancel deleting a review', async () => {
    const review = signInAndDispatchSavedReview();
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ review });

    await clickDeleteReview();

    const button = screen.getByRole('button', { name: 'Cancel' });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      cancelDeleteAddonReview({
        reviewId: review.id,
      }),
    );
  });

  it('dispatches deleteReview and displayes a deleting message when a user deletes a review', async () => {
    const review = signInAndDispatchSavedReview();
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ review });

    await clickDeleteReview();

    const button = screen.getByRole('button', { name: 'Delete' });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      deleteAddonReview({
        addonId: review.reviewAddon.id,
        errorHandlerId: getDefaultErrorHandlerId(review.id),
        reviewId: review.id,
      }),
    );

    expect(
      screen.queryByRole('button', { name: 'Delete review' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Deleting…')).toBeInTheDocument();
  });

  it('renders a delete link when an error occurs when deleting a review', async () => {
    const review = signInAndDispatchSavedReview();
    render({ review });

    await clickDeleteReview();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    createFailedErrorHandler({
      id: getDefaultErrorHandlerId(review.id),
      store,
    });

    expect(
      await screen.findByRole('button', { name: 'Delete review' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Deleting…')).not.toBeInTheDocument();
  });

  it('adds AddonReviewCard-ratingOnly to rating-only reviews', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: fakeRatingOnly,
    });
    render({ review });

    expect(screen.getByClassName('AddonReviewCard')).toHaveClass(
      'AddonReviewCard-ratingOnly',
    );
  });

  it('does not add AddonReviewCard-ratingOnly to reviews with a body', () => {
    const review = signInAndDispatchSavedReview({
      externalReview: {
        ...fakeReview,
        body: 'This is a written review',
      },
    });
    render({ review });

    expect(screen.getByClassName('AddonReviewCard')).not.toHaveClass(
      'AddonReviewCard-ratingOnly',
    );
  });

  it('shows FlagReviewMenu when signed out', () => {
    render({ review: _setReview() });

    expect(
      screen.getByRole('button', { description: 'Flag this review' }),
    ).toBeInTheDocument();
  });

  it('does not let you flag when declared as non-flaggable', () => {
    render({ flaggable: false, review: _setReview() });

    expect(
      screen.queryByRole('button', { description: 'Flag this review' }),
    ).not.toBeInTheDocument();
  });

  it('does not let you flag rating-only reviews', () => {
    render({ review: _setReview(fakeRatingOnly) });

    expect(
      screen.queryByRole('button', { description: 'Flag this review' }),
    ).not.toBeInTheDocument();
  });

  it('lets you flag a developer reply', () => {
    renderNestedReply();

    expect(
      screen.getByRole('button', {
        description: 'Flag this developer response',
      }),
    ).toBeInTheDocument();
  });

  it('does not let you flag a review before one has loaded', () => {
    render({ review: null });

    expect(
      screen.queryByRole('button', { description: 'Flag this review' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        description: 'Flag this developer response',
      }),
    ).not.toBeInTheDocument();
  });

  it('hides the flag button if you wrote the review', () => {
    const siteUserId = 123;
    const review = signInAndDispatchSavedReview({
      siteUserId,
      reviewUserId: siteUserId,
    });
    render({ review });

    expect(
      screen.queryByRole('button', { description: 'Flag this review' }),
    ).not.toBeInTheDocument();
  });

  it('allows review replies when siteUserCanReply is true', () => {
    dispatchSignInActionsWithStore({ store });
    const { addon, review } = createAddonAndReview();

    const dispatch = jest.spyOn(store, 'dispatch');
    render({
      addon,
      review,
      siteUserCanReply: true,
    });

    const button = screen.getByRole('link', { name: 'Reply to this review' });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      showReplyToReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('disallows review replies when siteUserCanReply is false', () => {
    dispatchSignInActionsWithStore({ store });
    const { addon, review } = createAddonAndReview();

    render({
      addon,
      review,
      siteUserCanReply: false,
    });

    expect(
      screen.queryByRole('link', { name: 'Reply to this review' }),
    ).not.toBeInTheDocument();
  });

  it('allows review replies for admins', () => {
    dispatchSignInActionsWithStore({
      store,
      userProps: { permissions: [ALL_SUPER_POWERS] },
    });
    const { addon, review } = createAddonAndReview();

    // Admin super powers should override siteUserCanReply.
    render({
      addon,
      review,
      siteUserCanReply: false,
    });

    expect(
      screen.getByRole('link', { name: 'Reply to this review' }),
    ).toBeInTheDocument();
  });

  it('disallows replies for rating-only reviews', () => {
    dispatchSignInActionsWithStore({ store });
    const { addon, review } = createAddonAndReview({
      externalReview: fakeRatingOnly,
    });

    render({
      addon,
      review,
      // This will be ignored since the review is rating-only.
      siteUserCanReply: true,
    });

    expect(
      screen.queryByRole('link', { name: 'Reply to this review' }),
    ).not.toBeInTheDocument();
  });

  it('hides reply button when already replying to a review', async () => {
    const { addon } = signInAsAddonDeveloper();
    render({ addon, review: _setReview(), siteUserCanReply: true });

    await clickReplyToReview();

    expect(
      screen.queryByRole('link', { name: 'Reply to this review' }),
    ).not.toBeInTheDocument();
  });

  it('hides reply button if you wrote the review', () => {
    const developerUserId = 3321;
    const { addon } = signInAsAddonDeveloper({ developerUserId });
    const review = _setReview({
      user: {
        ...fakeReview.user,
        id: developerUserId,
      },
    });
    render({ addon, review, siteUserCanReply: true });

    expect(
      screen.queryByRole('link', { name: 'Reply to this review' }),
    ).not.toBeInTheDocument();
  });

  it('configures a reply-to-review text form when editing', async () => {
    const { reply } = renderNestedReplyForSignedInDeveloper();

    await userEvent.click(screen.getByRole('link', { name: 'Edit reply' }));

    const textArea = screen.getByPlaceholderText(
      'Write a reply to this review.',
    );
    expect(textArea).toHaveValue(reply.body);

    await userEvent.type(textArea, 'Updated reply');

    await userEvent.click(screen.getByRole('button', { name: 'Update reply' }));

    expect(screen.getByRole('button', { name: 'Updating reply' })).toHaveClass(
      'Button--disabled',
    );
  });

  it('dispatches a finish action when dismissing a reply-to-review text form', async () => {
    const { addon } = signInAsAddonDeveloper();
    const dispatch = jest.spyOn(store, 'dispatch');
    const review = _setReview();
    render({ addon, review, siteUserCanReply: true });

    await clickReplyToReview();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(dispatch).toHaveBeenCalledWith(
      hideReplyToReviewForm({
        reviewId: review.id,
      }),
    );
  });

  it('allows a user to reply to a review', async () => {
    const { addon } = signInAsAddonDeveloper();
    const dispatch = jest.spyOn(store, 'dispatch');
    const replyBody = 'Body of the review';
    const review = _setReview();
    render({ addon, review, siteUserCanReply: true });

    await clickReplyToReview();
    expect(
      screen.queryByRole('link', { name: 'Reply to this review' }),
    ).not.toBeInTheDocument();

    const textArea = screen.getByPlaceholderText(
      'Write a reply to this review.',
    );
    expect(textArea).toHaveValue('');

    await userEvent.type(textArea, replyBody);
    await userEvent.click(
      screen.getByRole('button', { name: 'Publish reply' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendReplyToReview({
        errorHandlerId: getDefaultErrorHandlerId(review.id),
        originalReviewId: review.id,
        body: replyBody,
      }),
    );

    expect(
      screen.getByRole('button', { name: 'Publishing reply' }),
    ).toHaveClass('Button--disabled');
    expect(
      screen.queryByRole('button', { name: 'Publish reply' }),
    ).not.toBeInTheDocument();

    // The saga would dispatch this to hide the form.
    store.dispatch(hideReplyToReviewForm({ reviewId: review.id }));

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText('Write a reply to this review.'),
      ).not.toBeInTheDocument(),
    );
  });

  it('resets the reply form state when there is an error', async () => {
    const { addon } = signInAsAddonDeveloper();
    const review = _setReview();
    render({ addon, review, siteUserCanReply: true });

    await clickReplyToReview();
    await userEvent.type(
      screen.getByPlaceholderText('Write a reply to this review.'),
      'Body of the review',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Publish reply' }),
    );

    createFailedErrorHandler({
      id: getDefaultErrorHandlerId(review.id),
      store,
    });

    expect(
      await screen.findByRole('button', { name: 'Publish reply' }),
    ).not.toHaveClass('Button--disabled');
    expect(
      screen.queryByRole('button', { name: 'Publishing reply' }),
    ).not.toBeInTheDocument();
  });

  it('configures DismissibleTextForm with an ID', async () => {
    const { addon } = signInAsAddonDeveloper();
    const thisReview = _setReview({ ...fakeReview, id: 1 });
    const anotherReview = _setReview({ ...fakeReview, id: 2 });
    render({ addon, review: thisReview, siteUserCanReply: true });

    // Dispatch an action to show the form for a review in a different card.
    store.dispatch(showReplyToReviewForm({ reviewId: anotherReview.id }));

    expect(
      screen.queryByPlaceholderText('Write a reply to this review.'),
    ).not.toBeInTheDocument();

    // Dispatch an action to show the form for a review in this card.
    store.dispatch(showReplyToReviewForm({ reviewId: thisReview.id }));

    expect(
      await screen.findByPlaceholderText('Write a reply to this review.'),
    ).toBeInTheDocument();
  });

  it('renders errors', () => {
    const message = 'Some error message';
    const review = _setReview();
    createFailedErrorHandler({
      id: getDefaultErrorHandlerId(review.id),
      message,
      store,
    });
    render({ review });

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  describe('AddonReviewManager integration', () => {
    it('shows UserReview when not editng', () => {
      const review = signInAndDispatchSavedReview({
        externalReview: {
          ...fakeReview,
          score: 2,
        },
      });
      render({ review });

      expect(screen.getAllByTitle('Rated 2 out of 5')).toHaveLength(6);
      expect(screen.queryByText('Your star rating:')).not.toBeInTheDocument();
    });

    it('renders AddonReviewManager when editing', async () => {
      const review = signInAndDispatchSavedReview({
        externalReview: {
          ...fakeReview,
          score: 2,
        },
      });
      render({ review });

      await clickEditReview();

      expect(screen.getByText('Your star rating:')).toBeInTheDocument();
      expect(screen.getAllByTitle('Rated 2 out of 5')).toHaveLength(1);
    });

    it('configures AddonReviewManager with puffyButtons when slim=true', async () => {
      const review = signInAndDispatchSavedReview();
      render({ review, slim: true });

      await clickEditReview();

      expect(screen.getByRole('button', { name: 'Update review' })).toHaveClass(
        'Button--puffy',
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
        'Button--puffy',
      );
    });

    it('configures AddonReviewManager without puffyButtons when slim=false', async () => {
      const review = signInAndDispatchSavedReview();
      render({ review, slim: false });

      await clickEditReview();

      expect(
        screen.getByRole('button', { name: 'Update review' }),
      ).not.toHaveClass('Button--puffy');
      expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveClass(
        'Button--puffy',
      );
    });

    it('hides the review form on cancel', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const review = signInAndDispatchSavedReview();
      render({ review });

      await clickEditReview();
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(dispatch).toHaveBeenCalledWith(
        hideEditReviewForm({
          reviewId: review.id,
        }),
      );
    });

    it('hides the write review button when beginning to delete a rating', async () => {
      const review = signInAndDispatchSavedReview({
        externalReview: fakeRatingOnly,
      });
      render({ review });

      await clickDeleteRating();

      expect(
        screen.queryByRole('button', { name: 'Write a review' }),
      ).not.toBeInTheDocument();
    });

    it('hides the write review button for ratings when not logged in', async () => {
      const review = signInAndDispatchSavedReview({
        externalReview: fakeRatingOnly,
      });
      render({ review });

      expect(
        screen.getByRole('button', { name: 'Write a review' }),
      ).toBeInTheDocument();

      store.dispatch(logOutUser());

      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: 'Write a review' }),
        ).not.toBeInTheDocument(),
      );
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
      dispatchSignInActionsWithStore({ store, userId: loggedInUserId });

      render({ review });

      expect(
        screen.queryByRole('button', { name: 'Write a review' }),
      ).not.toBeInTheDocument();
    });

    it('will render a larger write review button for slim=true', () => {
      const review = signInAndDispatchSavedReview({
        externalReview: fakeRatingOnly,
      });
      render({ review, slim: true });

      expect(
        screen.queryByRole('button', { name: 'Write a review' }),
      ).toHaveClass('Button--puffy');
    });
  });

  describe('byLine', () => {
    it('renders a byLine with a permalink to the review', () => {
      const slug = 'some-slug';

      const review = signInAndDispatchSavedReview({
        externalReview: { ...fakeReview, addon: { ...fakeReview.addon, slug } },
      });
      render({ review });

      expect(
        screen.getByTitle(i18n.moment(review.created).format('lll')),
      ).toHaveAttribute(
        'href',
        `/en-US/android${reviewListURL({ addonSlug: slug, id: review.id })}`,
      );
    });

    it('uses the addonId for the byLine link when the reviewAddon has an empty slug', () => {
      // See https://github.com/mozilla/addons-frontend/issues/7322 for
      // the reason this test was added.
      const addonId = 999;

      const review = signInAndDispatchSavedReview({
        externalReview: {
          ...fakeReview,
          addon: { ...fakeReview.addon, id: addonId, slug: '' },
        },
      });
      render({ review });

      expect(
        screen.getByTitle(i18n.moment(review.created).format('lll')),
      ).toHaveAttribute(
        'href',
        `/en-US/android${reviewListURL({ addonSlug: addonId, id: review.id })}`,
      );
    });

    it('renders a byLine without a link when the reviewAddon has an empty slug and a falsey id', () => {
      // See https://github.com/mozilla/addons-frontend/issues/7322 for
      // the reason this test was added.

      const review = signInAndDispatchSavedReview({
        externalReview: {
          ...fakeReview,
          addon: { ...fakeReview.addon, id: 0, slug: '' },
        },
      });
      render({ review, store });

      expect(
        screen.queryByTitle(i18n.moment(review.created).format('lll')),
      ).not.toBeInTheDocument();
    });

    it('renders a byLine with a relative date', () => {
      const review = signInAndDispatchSavedReview();
      render({ i18n, review });

      expect(
        screen.getByTitle(i18n.moment(review.created).format('lll')),
      ).toHaveTextContent(i18n.moment(review.created).fromNow());
    });

    it('renders a byLine with an author by default', () => {
      const name = 'some_user';
      const review = signInAndDispatchSavedReview({
        reviewUserProps: { name },
      });
      render({ review });

      expect(screen.getByText(`by ${name},`)).toBeInTheDocument();
    });

    it('renders a short byLine for replies by default', () => {
      const { reply } = renderNestedReply();

      expect(
        screen.getByTextAcrossTags(
          `posted ${i18n.moment(reply.created).fromNow()}`,
        ),
      ).toBeInTheDocument();
    });

    it('renders a short byLine explicitly', () => {
      const review = _setReview(fakeReview);
      render({ shortByLine: true, review });

      expect(
        screen.getByTextAcrossTags(
          `posted ${i18n.moment(review.created).fromNow()}`,
        ),
      ).toBeInTheDocument();
    });

    it('linkifies username if current user is an admin', () => {
      dispatchSignInActionsWithStore({
        store,
        userProps: { permissions: [ALL_SUPER_POWERS] },
      });

      const review = _setReview(fakeReview);
      render({ review });

      expect(
        screen.getByRole('link', { name: review.userName }),
      ).toHaveAttribute('href', `/en-US/android/user/${review.userId}/`);
    });

    it('does not linkify username if current user is not an admin', () => {
      const review = _setReview(fakeReview);
      render({ review });

      expect(
        screen.queryByRole('link', { name: review.userName }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Developer reply to a review', () => {
    it('renders a nested reply', () => {
      const { review, reply } = renderNestedReply();

      expect(screen.getByText(review.body)).toBeInTheDocument();
      expect(screen.getByText(reply.body)).toBeInTheDocument();
    });

    it('hides rating stars', () => {
      renderReply();

      expect(screen.queryByClassName('Rating')).not.toBeInTheDocument();
    });

    it('passes isReply to the UserReview', () => {
      renderNestedReply();

      expect(
        screen.getByRole('heading', { name: 'Developer response' }),
      ).toBeInTheDocument();
      expect(screen.getByClassName('Icon-reply-arrow')).toBeInTheDocument();
    });

    it('hides rating stars even with showRating=true', () => {
      renderReply({ showRating: true });

      expect(screen.queryByClassName('Rating')).not.toBeInTheDocument();
    });

    it('hides the reply-to-review link on the developer reply', () => {
      renderNestedReplyForSignedInDeveloper({ siteUserCanReply: true });

      expect(
        screen.queryByRole('link', { name: 'Reply to this review' }),
      ).not.toBeInTheDocument();
    });

    it('Allows a developer to edit a reply and hides the reply while editing it', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const { review } = renderNestedReplyForSignedInDeveloper();

      expect(
        screen.getByRole('heading', { name: 'Developer response' }),
      ).toBeInTheDocument();

      await clickEditReply();

      expect(dispatch).toHaveBeenCalledWith(
        showReplyToReviewForm({
          reviewId: review.id,
        }),
      );

      expect(
        screen.queryByRole('heading', { name: 'Developer response' }),
      ).not.toBeInTheDocument();
    });

    it('does not include a user name in the byline', () => {
      const replyUserName = 'Bob';
      const reviewUserName = 'Daniel';

      renderNestedReply({ replyUserName, reviewUserName });

      expect(screen.getByText(`by ${reviewUserName},`)).toBeInTheDocument();
      expect(screen.queryByText(replyUserName)).not.toBeInTheDocument();
    });

    it('lets you edit a reply if siteUserCanReply is true', () => {
      const replyUserId = 123;
      dispatchSignInActionsWithStore({ store, userId: 999 });
      renderNestedReply({ replyUserId, siteUserCanReply: true });

      expect(
        screen.getByRole('link', { name: 'Edit reply' }),
      ).toBeInTheDocument();
    });

    it('allows a developer to delete a reply', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const { reply, review } = renderNestedReplyForSignedInDeveloper();

      expect(
        screen.getByRole('heading', { name: 'Developer response' }),
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Delete reply' }),
      );

      expect(
        screen.getByText('Do you really want to delete this reply?'),
      ).toBeInTheDocument();

      const button = screen.getByRole('button', {
        name: 'Delete',
      });
      const clickEvent = createEvent.click(button);
      const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

      fireEvent(button, clickEvent);

      expect(
        screen.queryByRole('button', { name: 'Delete reply' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Deleting…')).toBeInTheDocument();

      expect(preventDefaultWatcher).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(
        deleteAddonReview({
          addonId: review.reviewAddon.id,
          errorHandlerId: getDefaultErrorHandlerId(reply.id),
          isReplyToReviewId: review.id,
          reviewId: reply.id,
        }),
      );
    });

    it('renders a delete link when siteUserCanReply is true', () => {
      const replyUserId = 123;
      dispatchSignInActionsWithStore({ store, userId: 999 });
      renderNestedReply({ replyUserId, siteUserCanReply: true });

      expect(
        screen.getByRole('button', { name: 'Delete reply' }),
      ).toBeInTheDocument();
    });

    it('renders the expected delete confirm button text when slim=true', async () => {
      renderNestedReplyForSignedInDeveloper({ slim: true });

      await userEvent.click(
        screen.getByRole('button', { name: 'Delete reply' }),
      );

      expect(
        screen.getByRole('button', { name: 'Delete reply' }),
      ).toBeInTheDocument();
    });

    it('renders a non-nested reply', () => {
      const { review, reply } = _setReviewReply();
      // Set showRating to true to prove that we will not show a rating for a reply.
      render({ review: reply, showRating: true });

      expect(screen.getByText(reply.body)).toBeInTheDocument();
      expect(screen.queryByClassName('Rating')).not.toBeInTheDocument();
      expect(screen.queryByText(review.body)).not.toBeInTheDocument();
    });
  });

  describe('Tests for UserRating', () => {
    it('renders a Rating', () => {
      render({ review: _setReview({ score: 2 }) });

      const rating = screen.getByClassName('Rating');
      expect(rating).toHaveClass('Rating--small');
      expect(rating).not.toHaveClass('Rating--editable');
      expect(screen.getAllByTitle('Rated 2 out of 5')).toHaveLength(6);
    });

    it('passes yellowStars: true to Rating if you wrote the review', () => {
      const review = signInAndDispatchSavedReview();
      render({ review });

      expect(screen.getByClassName('Rating--yellowStars')).toBeInTheDocument();
    });

    it('passes yellowStars: false to Rating if you did not write the review', () => {
      const review = createReviewAndSignInAsUnrelatedUser();
      render({ review });

      expect(
        screen.queryByClassName('Rating--yellowStars'),
      ).not.toBeInTheDocument();
    });

    it('passes yellowStars: false to Rating if no user is logged in', () => {
      render({ review: _setReview() });

      expect(
        screen.queryByClassName('Rating--yellowStars'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for UserReview', () => {
    it('renders LoadingText without a review', () => {
      render();

      // Expect two loading indicators, one for the byLine and one for the body
      // of the review.
      expect(screen.getAllByRole('alert')).toHaveLength(2);
    });

    it('renders newlines in review bodies', () => {
      render({
        review: _setReview({ body: "It's awesome \n isn't it?" }),
      });

      expect(
        screen.getByTextAcrossTags(`It's awesome  isn't it?`),
      ).toBeInTheDocument();
      expect(
        within(screen.getByClassName('UserReview-body')).getByTagName('br'),
      ).toBeInTheDocument();
    });

    it('does not render an empty review body, but adds the expected class name', () => {
      render({
        review: _setReview({ body: undefined }),
      });

      const reviewBody = screen.getByClassName('UserReview-body');
      expect(reviewBody).toHaveTextContent('');
      expect(reviewBody).toHaveClass('UserReview-emptyBody');
    });

    // These will need to be tested in the context of a page, so we can
    // navigate to a different review, which should cause the contentId
    // to change.
    // See also https://github.com/mozilla/addons-frontend/issues/11409.
    // eslint-disable-next-line jest/no-commented-out-tests
    /*
    it('passes the expected contentId to ShowMoreCard', () => {
      const id = 12345;
      const review = _setReview({ ...fakeReview, id });
      render({ review });

      expect(root.find('.UserReview-body')).toHaveProp('contentId', String(id));
    });

    it('passes the expected contentId to ShowMoreCard without a review', () => {
      render({ review: undefined });

      expect(root.find('.UserReview-body')).toHaveProp('contentId', loadingId);
    });
    */

    it('does not add UserReview-emptyBody when there is a body', () => {
      render({
        review: _setReview({
          body: 'This add-on is fantastic',
        }),
      });

      expect(screen.getByClassName('UserReview-body')).not.toHaveClass(
        'UserReview-emptyBody',
      );
    });

    it('does not show a developer response header by default', () => {
      render();

      expect(
        screen.queryByRole('heading', { name: 'Developer response' }),
      ).not.toBeInTheDocument();
    });

    it('does not show a developer response header for non-replies', () => {
      render({ review: _setReview() });

      expect(
        screen.queryByRole('heading', { name: 'Developer response' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for AddonReviewManagerRating', () => {
    it('sets readOnly correctly when onSelectRating is defined', async () => {
      render({ review: signInAndDispatchSavedReview() });

      // AddonReviewManagerRating is rendered in edit mode.
      await clickEditReview();

      expect(
        screen.getByTitle('Update your rating to 1 out of 5'),
      ).toBeInTheDocument();
    });
  });

  describe('Tests for AddonReviewManager', () => {
    const getErrorHandlerId = (reviewId) =>
      `src/amo/components/AddonReviewManager/index.js-${reviewId}`;

    it('renders DismissibleTextForm text', async () => {
      const body = 'This ad blocker add-on is easy on CPU';
      const review = signInAndDispatchSavedReview({
        externalReview: { ...fakeReview, body },
      });
      render({ review });

      // AddonReviewManager is rendered in edit mode.
      await clickEditReview();

      expect(
        screen.getByPlaceholderText(
          'Write about your experience with this add-on.',
        ),
      ).toHaveValue(body);
    });

    it('renders a DismissibleTextForm formFooter', async () => {
      render({ review: signInAndDispatchSavedReview() });

      await clickEditReview();

      expect(
        screen.getByRole('link', { name: 'review guidelines' }),
      ).toHaveAttribute('href', '/en-US/review_guide');
      expect(
        screen.getByTextAcrossTags('Please follow our review guidelines.'),
      ).toBeInTheDocument();
    });

    it('updates the rating when you select a star', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const newScore = 4;
      const review = signInAndDispatchSavedReview({ score: 2 });
      render({ review });

      await clickEditReview();

      await userEvent.click(
        screen.getByRole('button', {
          name: `Update your rating to ${newScore} out of 5`,
        }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        updateAddonReview({
          score: newScore,
          errorHandlerId: getErrorHandlerId(review.id),
          reviewId: review.id,
        }),
      );
    });

    it('updates the review body when you submit the form', async () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const newBody = 'I really like the colors of this add-on';
      const review = signInAndDispatchSavedReview({
        body: 'I dislike the colors',
      });
      render({ review });

      await clickEditReview();

      const input = screen.getByPlaceholderText(
        'Write about your experience with this add-on.',
      );
      await userEvent.clear(input);
      await userEvent.type(input, newBody);

      await userEvent.click(
        screen.getByRole('button', { name: 'Update review' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        updateAddonReview({
          body: newBody,
          errorHandlerId: getErrorHandlerId(review.id),
          reviewId: review.id,
        }),
      );
    });

    it('renders errors', async () => {
      const message = 'Some error message';
      const review = signInAndDispatchSavedReview();
      createFailedErrorHandler({
        id: getErrorHandlerId(review.id),
        message,
        store,
      });
      render({ review });

      await clickEditReview();

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('flashes a saving rating message', async () => {
      // This is dispatched via a saga, so we need to dispatch it manually.
      store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));
      render({ review: signInAndDispatchSavedReview() });

      await clickEditReview();

      const flashMessage = screen.getByClassName(
        'AddonReviewManager-savedRating',
      );
      expect(flashMessage).toHaveTextContent('Saving');
      expect(flashMessage).not.toHaveClass(
        'RatingManagerNotice-savedRating-hidden',
      );
      // In this case a span is rendered, rather than a Notice component.
      expect(flashMessage).not.toHaveClass('Notice');
    });

    it('flashes a saved rating message', async () => {
      // This is dispatched via a saga, so we need to dispatch it manually.
      store.dispatch(flashReviewMessage(SAVED_RATING));
      render({ review: signInAndDispatchSavedReview() });

      await clickEditReview();

      const flashMessage = screen.getByClassName(
        'AddonReviewManager-savedRating',
      );
      expect(flashMessage).toHaveTextContent('Saved');
      expect(flashMessage).not.toHaveClass(
        'RatingManagerNotice-savedRating-hidden',
      );
    });

    it('hides a flashed rating message', async () => {
      // This is dispatched via a saga, so we need to dispatch it manually.
      // Set a message then hide it.
      store.dispatch(flashReviewMessage(SAVED_RATING));
      store.dispatch(hideFlashedReviewMessage());
      render({ review: signInAndDispatchSavedReview() });

      await clickEditReview();

      expect(
        screen.getByClassName('AddonReviewManager-savedRating'),
      ).toHaveClass('RatingManagerNotice-savedRating-hidden');
    });

    it('enters a submitting review state', async () => {
      store.dispatch(flashReviewMessage(STARTED_SAVE_REVIEW));
      render({ review: signInAndDispatchSavedReview() });

      await clickEditReview();

      expect(
        screen.getByRole('button', { name: 'Updating review' }),
      ).toHaveClass('Button--disabled');
    });

    it('does not enter a submitting state by default', async () => {
      render({ review: signInAndDispatchSavedReview() });

      await clickEditReview();

      expect(
        screen.getByRole('button', { name: 'Update review' }),
      ).toBeInTheDocument();
    });

    it('passes a null review while saving a rating', async () => {
      store.dispatch(flashReviewMessage(STARTED_SAVE_RATING));
      render({ review: signInAndDispatchSavedReview() });

      await clickEditReview();

      // A null rating will render Rating in a loading state.
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('allows one to submit a review when no review text exists yet', async () => {
      const body = 'My review';
      const dispatch = jest.spyOn(store, 'dispatch');
      const review = signInAndDispatchSavedReview({
        externalReview: fakeRatingOnly,
      });
      render({ review });

      await userEvent.click(
        screen.getByRole('button', { name: 'Write a review' }),
      );
      expect(
        screen.queryByRole('button', { name: 'Write a review' }),
      ).not.toBeInTheDocument();

      await userEvent.type(
        screen.getByPlaceholderText(
          'Write about your experience with this add-on.',
        ),
        body,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Submit review' }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        showEditReviewForm({ reviewId: review.id }),
      );

      // This is called by a saga when saving starts, so we need to dispatch it
      // manually.
      store.dispatch(flashReviewMessage(STARTED_SAVE_REVIEW));

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Submitting review' }),
        ).toHaveClass('Button--disabled'),
      );
    });

    describe('extractId', () => {
      it('extracts an ID from the review', () => {
        const id = 551224;
        const lang = 'en-US';
        expect(
          addonReviewManagerExtractId({
            review: createInternalReview({ ...fakeReview, id }, lang),
          }),
        ).toEqual(id.toString());
      });
    });
  });
});
