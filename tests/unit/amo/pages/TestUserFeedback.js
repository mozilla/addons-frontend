/* global window */
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

import {
  sendUserAbuseReport,
  loadUserAbuseReport,
} from 'amo/reducers/userAbuseReports';
import {
  CATEGORY_FEEDBACK_SPAM,
  CATEGORY_SOMETHING_ELSE,
} from 'amo/components/FeedbackForm';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  FETCH_USER_ACCOUNT,
  fetchUserAccount,
  loadUserAccount,
} from 'amo/reducers/users';
import { extractId } from 'amo/pages/UserFeedback';
import { clearError } from 'amo/reducers/errors';
import { createApiError } from 'amo/api';
import {
  createUserAccountResponse,
  createFailedErrorHandler,
  createFakeErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  beforeEach(() => {
    window.scroll = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const getErrorHandlerId = (userId) =>
    `src/amo/pages/UserFeedback/index.js-${userId}`;

  const signInUserWithProps = (
    props = {},
    store = dispatchClientMetadata().store,
  ) => {
    const { id, ...userProps } = props;

    return dispatchSignInActionsWithStore({ userId: id, userProps, store });
  };

  const renderWithoutLoading = ({
    userId,
    lang = 'en-US',
    clientApp = CLIENT_APP_FIREFOX,
    store = dispatchClientMetadata({ lang, clientApp }).store,
  }) => {
    const renderOptions = {
      initialEntries: [`/${lang}/${clientApp}/feedback/user/${userId}/`],
      store,
    };
    return defaultRender(renderOptions);
  };

  const render = (userProps = {}, store = dispatchClientMetadata().store) => {
    const user = createUserAccountResponse(userProps);
    store.dispatch(loadUserAccount({ user }));

    return renderWithoutLoading({ userId: user.id, store });
  };

  describe('error handling', () => {
    it('renders errors', () => {
      const userId = 1234;
      const message = 'Some error message';
      const { store } = dispatchClientMetadata();
      createFailedErrorHandler({
        id: getErrorHandlerId(userId),
        message,
        store,
      });

      render({ id: userId }, store);

      expect(screen.getByText(message)).toBeInTheDocument();

      // We do not call `scroll()` here because we mount the component and
      // `componentDidUpdate()` is not called. It is valid because we only
      // mount the component when the server processes the request OR the user
      // navigates to the feedback form page and, in both cases, the scroll
      // will be at the top of the page.
      expect(window.scroll).not.toHaveBeenCalled();
    });

    it('scrolls to the top of the page when an error is rendered', async () => {
      const userId = 1234;
      const { store } = dispatchClientMetadata();

      render({ id: userId }, store);

      createFailedErrorHandler({ id: getErrorHandlerId(userId), store });

      await waitFor(() => expect(window.scroll).toHaveBeenCalledWith(0, 0));
    });

    it('clears the error handler when unmounting', () => {
      const userId = 1234;
      const { store } = dispatchClientMetadata();
      const dispatch = jest.spyOn(store, 'dispatch');
      createFailedErrorHandler({ id: getErrorHandlerId(userId), store });
      const { unmount } = render({ id: userId }, store);

      unmount();

      expect(dispatch).toHaveBeenCalledWith(
        clearError(getErrorHandlerId(userId)),
      );
    });

    it('does not fetch the user when there is an error', () => {
      const userId = 1234;
      const { store } = dispatchClientMetadata();
      createFailedErrorHandler({ id: getErrorHandlerId(userId), store });
      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithoutLoading({ userId, store });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: FETCH_USER_ACCOUNT,
        }),
      );
    });

    describe('extractId', () => {
      it('returns a unique ID based on params', () => {
        const userId = 8;
        expect(extractId({ match: { params: { userId } } })).toEqual('8');
      });
    });
  });

  it('renders a 404 page when the API returned a 404', () => {
    const userId = 1234;
    const { store } = dispatchClientMetadata();
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
      id: getErrorHandlerId(userId),
      store,
    });

    render({ id: userId }, store);

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('dispatches fetchUserAccount when the user is not loaded yet', () => {
    const userId = 1234;
    const { store } = dispatchClientMetadata();
    const dispatch = jest.spyOn(store, 'dispatch');
    const errorHandler = createFakeErrorHandler({
      id: getErrorHandlerId(userId),
    });

    renderWithoutLoading({ userId, store });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: errorHandler.id,
        userId: `${userId}`,
      }),
    );
  });

  it('renders the feedback form for a signed out user', () => {
    const username = 'some user name';

    render({ username });

    // Header.
    expect(screen.getByText(username)).toBeInTheDocument();

    expect(screen.getByText(`Report this user to Mozilla`)).toBeInTheDocument();
    expect(screen.getByText('Submit report')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name (required)');
    expect(nameInput).not.toBeDisabled();
    expect(nameInput.value).toBeEmpty();

    const emailInput = screen.getByLabelText('Your email address (required)');
    expect(emailInput).not.toBeDisabled();
    expect(emailInput.value).toBeEmpty();

    // This should never be shown for users.
    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation',
      }),
    ).not.toBeInTheDocument();

    // We shouldn't show the confirmation message.
    expect(
      screen.queryByClassName('FeedbackForm-success-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it('renders the feedback form for a signed in user', () => {
    const signedInUsername = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInUsername,
      email: signedInEmail,
    });
    const username = 'some user name';

    render({ username }, store);

    // Header.
    expect(screen.getByText(username)).toBeInTheDocument();

    expect(screen.getByText(`Report this user to Mozilla`)).toBeInTheDocument();
    expect(screen.getByText('Submit report')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name (required)');
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue(signedInUsername);

    const emailInput = screen.getByLabelText('Your email address (required)');
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue(signedInEmail);

    // This should never be shown for users.
    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation',
      }),
    ).not.toBeInTheDocument();

    // SignedInUser component should be visible.
    expect(
      screen.getByText(`Signed in as ${signedInUsername}`),
    ).toBeInTheDocument();

    // We shouldn't show the confirmation message.
    expect(
      screen.queryByClassName('FeedbackForm-success-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it('renders the different categories for a user', () => {
    render();

    // A
    expect(screen.queryByLabelText(/^It doesn’t work/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Example: Features are slow/),
    ).not.toBeInTheDocument();

    // B
    expect(screen.getByLabelText('It’s spam')).toBeInTheDocument();
    expect(screen.getByLabelText('It’s spam')).toBeRequired();
    expect(
      screen.getByText(/^Example: The listing advertises/),
    ).toBeInTheDocument();

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

  it('dispatches sendUserAbuseReport with all fields on submit', async () => {
    const userId = 9999;
    const { store } = dispatchClientMetadata();
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ id: userId }, store);

    await userEvent.click(screen.getByRole('radio', { name: 'It’s spam' }));
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'File report anonymously',
      }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendUserAbuseReport({
        userId,
        errorHandlerId: getErrorHandlerId(userId),
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: CATEGORY_FEEDBACK_SPAM,
        auth: false,
      }),
    );
  });

  it('dispatches sendUserAbuseReport action with all fields on submit for a signed-in user', async () => {
    const signedInName = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInName,
      email: signedInEmail,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = 10;
    render({ id: userId }, store);

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendUserAbuseReport({
        userId,
        errorHandlerId: getErrorHandlerId(userId),
        reporterEmail: signedInEmail,
        reporterName: signedInName,
        message: '',
        reason: CATEGORY_SOMETHING_ELSE,
        auth: true,
      }),
    );
  });

  it('dispatches sendUserAbuseReport action with all fields on submit for a signed-in user who files the report anonymously', async () => {
    const signedInName = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInName,
      email: signedInEmail,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = 10;
    render({ id: userId }, store);

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
      sendUserAbuseReport({
        userId,
        errorHandlerId: getErrorHandlerId(userId),
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: CATEGORY_SOMETHING_ELSE,
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

  it('shows success message after submission', async () => {
    const userId = 456;
    const { store } = dispatchClientMetadata();

    render({ id: userId }, store);

    store.dispatch(
      loadUserAbuseReport({ userId, message: 'some message', reporter: null }),
    );

    expect(
      await screen.findByText(
        'We have received your report. Thanks for letting us know.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Report this user to Mozilla'),
    ).not.toBeInTheDocument();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('renders a submit button with a different text when updating', async () => {
    render();

    await userEvent.click(screen.getByRole('radio', { name: 'It’s spam' }));
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
});
