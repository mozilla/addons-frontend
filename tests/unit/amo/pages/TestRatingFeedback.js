/* global window */
import config from 'config';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

import {
  FETCH_REVIEW,
  fetchReview,
  sendRatingAbuseReport,
  setReview,
  setReviewWasFlagged,
} from 'amo/actions/reviews';
import { CATEGORY_OTHER } from 'amo/components/FeedbackForm';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { extractId } from 'amo/pages/RatingFeedback';
import { clearError } from 'amo/reducers/errors';
import { createApiError } from 'amo/api';
import {
  createFailedErrorHandler,
  createFakeErrorHandler,
  createLocalizedString,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeReview,
  getMockConfig,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

jest.mock('config');

describe(__filename, () => {
  let fakeConfig;

  beforeEach(() => {
    fakeConfig = getMockConfig({ enableFeatureFeedbackForm: true });
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });

    window.scroll = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const getErrorHandlerId = (ratingId) =>
    `src/amo/pages/RatingFeedback/index.js-${ratingId}`;

  const signInUserWithProps = (
    props = {},
    store = dispatchClientMetadata().store,
  ) => {
    const { id, ...userProps } = props;

    return dispatchSignInActionsWithStore({ userId: id, userProps, store });
  };

  const renderWithoutLoading = ({
    ratingId,
    lang = 'en-US',
    clientApp = CLIENT_APP_FIREFOX,
    store = dispatchClientMetadata({ lang, clientApp }).store,
  }) => {
    const renderOptions = {
      initialEntries: [`/${lang}/${clientApp}/feedback/review/${ratingId}/`],
      store,
    };
    return defaultRender(renderOptions);
  };

  const render = (props = {}, store = dispatchClientMetadata().store) => {
    const review = { ...fakeReview, ...props };
    store.dispatch(setReview(review));

    return renderWithoutLoading({ ratingId: review.id, store });
  };

  describe('error handling', () => {
    it('renders errors', () => {
      const ratingId = 1234;
      const message = 'Some error message';
      const { store } = dispatchClientMetadata();
      createFailedErrorHandler({
        id: getErrorHandlerId(ratingId),
        message,
        store,
      });

      render({ id: ratingId }, store);

      expect(screen.getByText(message)).toBeInTheDocument();

      // We do not call `scroll()` here because we mount the component and
      // `componentDidUpdate()` is not called. It is valid because we only
      // mount the component when the server processes the request OR the user
      // navigates to the feedback form page and, in both cases, the scroll
      // will be at the top of the page.
      expect(window.scroll).not.toHaveBeenCalled();
    });

    it('scrolls to the top of the page when an error is rendered', async () => {
      const ratingId = 1234;
      const { store } = dispatchClientMetadata();

      render({ id: ratingId }, store);

      createFailedErrorHandler({ id: getErrorHandlerId(ratingId), store });

      await waitFor(() => expect(window.scroll).toHaveBeenCalledWith(0, 0));
    });

    it('clears the error handler when unmounting', () => {
      const ratingId = 1234;
      const { store } = dispatchClientMetadata();
      const dispatch = jest.spyOn(store, 'dispatch');
      createFailedErrorHandler({ id: getErrorHandlerId(ratingId), store });
      const { unmount } = render({ id: ratingId }, store);

      unmount();

      expect(dispatch).toHaveBeenCalledWith(
        clearError(getErrorHandlerId(ratingId)),
      );
    });

    it('does not fetch the review when there is an error', () => {
      const ratingId = 1234;
      const { store } = dispatchClientMetadata();
      createFailedErrorHandler({ id: getErrorHandlerId(ratingId), store });
      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithoutLoading({ ratingId, store });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: FETCH_REVIEW,
        }),
      );
    });

    describe('extractId', () => {
      it('returns a unique ID based on params', () => {
        const ratingId = 8;
        expect(extractId({ match: { params: { ratingId } } })).toEqual('8');
      });
    });
  });

  it('renders a 404 page when enableFeatureFeedbackForm is false', () => {
    fakeConfig = { ...fakeConfig, enableFeatureFeedbackForm: false };

    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders a 404 page when the API returned a 404', () => {
    const ratingId = 1234;
    const { store } = dispatchClientMetadata();
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
      id: getErrorHandlerId(ratingId),
      store,
    });

    render({ id: ratingId }, store);

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('dispatches fetchReview when the review is not loaded yet', () => {
    const ratingId = 1234;
    const { store } = dispatchClientMetadata();
    const dispatch = jest.spyOn(store, 'dispatch');
    const errorHandler = createFakeErrorHandler({
      id: getErrorHandlerId(ratingId),
    });

    renderWithoutLoading({ ratingId, store });

    expect(dispatch).toHaveBeenCalledWith(
      fetchReview({ errorHandlerId: errorHandler.id, reviewId: `${ratingId}` }),
    );
  });

  it('renders the feedback form for a signed out user', () => {
    const reviewBody = 'this is a review about an add-on';
    const addonName = 'some add-on name';
    const reviewAddon = {
      ...fakeReview.addon,
      name: createLocalizedString(addonName),
    };
    const userName = 'some user name';
    const reviewUser = { ...fakeReview.user, name: userName };

    render({ body: reviewBody, addon: reviewAddon, user: reviewUser });

    // Header.
    expect(screen.getByText(addonName)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`^by ${userName}, `)),
    ).toBeInTheDocument();
    expect(screen.getByText(reviewBody)).toBeInTheDocument();

    expect(
      screen.getByText(`Report this review to Mozilla`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Report the review because it is illegal or incompliant',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Submit report')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name(required)');
    expect(nameInput).not.toBeDisabled();
    expect(nameInput.value).toBeEmpty();

    const emailInput = screen.getByLabelText('Your email address(required)');
    expect(emailInput).not.toBeDisabled();
    expect(emailInput.value).toBeEmpty();

    // This should never be shown for reviews.
    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation (optional)',
      }),
    ).not.toBeInTheDocument();

    // We shouldn't show the confirmation message.
    expect(
      screen.queryByClassName('FeedbackForm-success-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it('renders the feedback form for a signed in user', () => {
    const signedInName = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInName,
      email: signedInEmail,
    });
    const reviewBody = 'this is a review about an add-on';

    render({ body: reviewBody }, store);

    // Header.
    expect(screen.getByText(reviewBody)).toBeInTheDocument();

    expect(
      screen.getByText(`Report this review to Mozilla`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Report the review because it is illegal or incompliant',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Submit report')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name(required)');
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue(signedInName);

    const emailInput = screen.getByLabelText('Your email address(required)');
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue(signedInEmail);

    // This should never be shown for reviews.
    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation (optional)',
      }),
    ).not.toBeInTheDocument();

    // SignedInRating component should be visible.
    expect(
      screen.getByText(`Signed in as ${signedInName}`),
    ).toBeInTheDocument();

    // We shouldn't show the confirmation message.
    expect(
      screen.queryByClassName('FeedbackForm-success-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it('renders the different categories for a review', () => {
    render();

    // A
    expect(screen.queryByLabelText(/^It doesn’t work/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Example: Features are slow/),
    ).not.toBeInTheDocument();

    // B
    expect(screen.queryByLabelText('It’s spam')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Example: The listing advertises/),
    ).not.toBeInTheDocument();

    // C
    expect(
      screen.queryByLabelText('It violates Add-on Policies'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Example: It compromised/),
    ).not.toBeInTheDocument();

    // D
    expect(screen.getByLabelText(/^It contains hateful/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^It contains hateful/)).toBeRequired();
    expect(
      screen.getByText(/^Example: It contains racist/),
    ).toBeInTheDocument();

    // E
    expect(screen.getByLabelText(/^It violates the law /)).toBeInTheDocument();
    expect(screen.getByLabelText(/^It violates the law /)).toBeRequired();
    expect(screen.getByText(/^Example: Copyright/)).toBeInTheDocument();

    // F
    expect(screen.getByLabelText('Something else')).toBeInTheDocument();
    expect(screen.getByLabelText('Something else')).toBeRequired();
    expect(screen.getByText(/^Anything that doesn’t/)).toBeInTheDocument();
  });

  it('dispatches sendRatingAbuseReport with all fields on submit', async () => {
    const ratingId = 9999;
    const { store } = dispatchClientMetadata();
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ id: ratingId }, store);

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'File report anonymously',
      }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendRatingAbuseReport({
        ratingId,
        errorHandlerId: getErrorHandlerId(ratingId),
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: CATEGORY_OTHER,
        auth: false,
      }),
    );
  });

  it('dispatches sendRatingAbuseReport action with all fields on submit for a signed-in user', async () => {
    const signedInName = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInName,
      email: signedInEmail,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    const ratingId = 10;
    render({ id: ratingId }, store);

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendRatingAbuseReport({
        ratingId,
        errorHandlerId: getErrorHandlerId(ratingId),
        reporterEmail: signedInEmail,
        reporterName: signedInName,
        message: '',
        reason: CATEGORY_OTHER,
        auth: true,
      }),
    );
  });

  it('dispatches sendRatingAbuseReport action with all fields on submit for a signed-in user who files the report anonymously', async () => {
    const signedInName = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInName,
      email: signedInEmail,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    const ratingId = 10;
    render({ id: ratingId }, store);

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'File report anonymously',
      }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendRatingAbuseReport({
        ratingId,
        errorHandlerId: getErrorHandlerId(ratingId),
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: CATEGORY_OTHER,
        auth: false,
      }),
    );
  });

  it('shows a certification checkbox when the chosen reason requires it', async () => {
    render();

    expect(
      screen.queryByLabelText(/^By submitting this report I certify/),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'It violates the law or contains content that violates the law',
      }),
    );

    expect(
      screen.getByLabelText(/^By submitting this report I certify/),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );

    expect(
      screen.queryByLabelText(/^By submitting this report I certify/),
    ).not.toBeInTheDocument();
  });

  it('disables the submit button when no reason selected', async () => {
    render();

    expect(
      screen.getByRole('button', { name: 'Submit report' }),
    ).toBeDisabled();
  });

  it('shows success message after submission', async () => {
    const ratingId = 456;
    const { store } = dispatchClientMetadata();

    render({ id: ratingId }, store);

    store.dispatch(
      setReviewWasFlagged({ reviewId: ratingId, reason: CATEGORY_OTHER }),
    );

    expect(
      await screen.findByText(
        'We have received your report. Thanks for letting us know.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Report this review to Mozilla'),
    ).not.toBeInTheDocument();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('renders a submit button with a different text when updating', async () => {
    render();

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'File report anonymously',
      }),
    );

    expect(
      screen.getByRole('button', { name: 'Submit report' }),
    ).not.toBeDisabled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(
      screen.getByRole('button', { name: 'Submitting your report…' }),
    ).toBeInTheDocument();
  });

  it('does not render the stars when the review is a developer reply', () => {
    render({ is_developer_reply: true });

    expect(screen.queryByClassName('Rating')).not.toBeInTheDocument();
  });
});
