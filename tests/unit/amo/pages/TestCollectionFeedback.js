/* global window */
import config from 'config';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

import {
  FETCH_CURRENT_COLLECTION,
  fetchCurrentCollection,
  loadCurrentCollection,
} from 'amo/reducers/collections';
import {
  sendCollectionAbuseReport,
  loadCollectionAbuseReport,
} from 'amo/reducers/collectionAbuseReports';
import {
  CATEGORY_FEEDBACK_SPAM,
  CATEGORY_SOMETHING_ELSE,
} from 'amo/components/FeedbackForm';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { extractId } from 'amo/pages/CollectionFeedback';
import { clearError } from 'amo/reducers/errors';
import { createApiError } from 'amo/api';
import {
  createFailedErrorHandler,
  createFakeCollectionDetail,
  createFakeErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
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

  const getErrorHandlerId = (authorId, collectionSlug) =>
    `src/amo/pages/CollectionFeedback/index.js-${authorId}-${collectionSlug}`;

  const signInUserWithProps = (
    props = {},
    store = dispatchClientMetadata().store,
  ) => {
    const { id: userId, ...userProps } = props;

    return dispatchSignInActionsWithStore({ userId, userProps, store });
  };

  const renderWithoutLoading = ({
    authorId,
    slug,
    lang = 'en-US',
    clientApp = CLIENT_APP_FIREFOX,
    store = dispatchClientMetadata({ lang, clientApp }).store,
  }) => {
    const renderOptions = {
      initialEntries: [
        `/${lang}/${clientApp}/feedback/collection/${authorId}/${slug}/`,
      ],
      store,
    };
    return defaultRender(renderOptions);
  };

  const render = (detailProps = {}, store = dispatchClientMetadata().store) => {
    const detail = createFakeCollectionDetail(detailProps);
    store.dispatch(loadCurrentCollection({ detail }));

    return renderWithoutLoading({
      authorId: detail.author.id,
      slug: detail.slug,
      store,
    });
  };

  describe('error handling', () => {
    it('renders errors', () => {
      const authorId = 1234;
      const collectionSlug = 'some-collection-slug';
      const message = 'Some error message';
      const { store } = dispatchClientMetadata();
      createFailedErrorHandler({
        id: getErrorHandlerId(authorId, collectionSlug),
        message,
        store,
      });

      render({ authorId, slug: collectionSlug }, store);

      expect(screen.getByText(message)).toBeInTheDocument();

      // We do not call `scroll()` here because we mount the component and
      // `componentDidUpdate()` is not called. It is valid because we only
      // mount the component when the server processes the request OR the user
      // navigates to the feedback form page and, in both cases, the scroll
      // will be at the top of the page.
      expect(window.scroll).not.toHaveBeenCalled();
    });

    it('scrolls to the top of the page when an error is rendered', async () => {
      const authorId = 1234;
      const collectionSlug = 'some-collection-slug';
      const { store } = dispatchClientMetadata();

      render({ authorId, slug: collectionSlug }, store);

      createFailedErrorHandler({
        id: getErrorHandlerId(authorId, collectionSlug),
        store,
      });

      await waitFor(() => expect(window.scroll).toHaveBeenCalledWith(0, 0));
    });

    it('clears the error handler when unmounting', () => {
      const authorId = 1234;
      const collectionSlug = 'some-collection-slug';
      const { store } = dispatchClientMetadata();
      const dispatch = jest.spyOn(store, 'dispatch');
      const errorHandlerId = getErrorHandlerId(authorId, collectionSlug);
      createFailedErrorHandler({ id: errorHandlerId, store });
      const { unmount } = render({ authorId, slug: collectionSlug }, store);

      unmount();

      expect(dispatch).toHaveBeenCalledWith(clearError(errorHandlerId));
    });

    it('does not fetch the current collection when there is an error', () => {
      const authorId = 1234;
      const collectionSlug = 'some-collection-slug';
      const { store } = dispatchClientMetadata();
      createFailedErrorHandler({
        id: getErrorHandlerId(authorId, collectionSlug),
        store,
      });
      const dispatch = jest.spyOn(store, 'dispatch');

      renderWithoutLoading({ authorId, slug: collectionSlug, store });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: FETCH_CURRENT_COLLECTION,
        }),
      );
    });

    describe('extractId', () => {
      it('returns a unique ID based on params', () => {
        const authorId = 8;
        const collectionSlug = 'some-collection-slug';

        expect(
          extractId({ match: { params: { authorId, collectionSlug } } }),
        ).toEqual('8-some-collection-slug');
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
    const authorId = 1234;
    const collectionSlug = 'some-collection-slug';
    const { store } = dispatchClientMetadata();
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
      id: getErrorHandlerId(authorId, collectionSlug),
      store,
    });

    render({ authorId, slug: collectionSlug }, store);

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('dispatches fetchCurrentCollection when the collection is not loaded yet', () => {
    const authorId = 1234;
    const collectionSlug = 'some-slug';
    const { store } = dispatchClientMetadata();
    const dispatch = jest.spyOn(store, 'dispatch');
    const errorHandler = createFakeErrorHandler({
      id: getErrorHandlerId(authorId, collectionSlug),
    });

    renderWithoutLoading({ authorId, slug: collectionSlug, store });

    expect(dispatch).toHaveBeenCalledWith(
      fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        userId: `${authorId}`,
        slug: collectionSlug,
      }),
    );
  });

  it('renders the feedback form for a signed out user', () => {
    const name = 'some collection name';

    render({ name });

    // Header.
    expect(screen.getByText(name)).toBeInTheDocument();

    expect(
      screen.getByText(`Report this collection to Mozilla`),
    ).toBeInTheDocument();
    expect(screen.getByText('Submit report')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name (required)');
    expect(nameInput).not.toBeDisabled();
    expect(nameInput.value).toBeEmpty();

    const emailInput = screen.getByLabelText('Your email address (required)');
    expect(emailInput).not.toBeDisabled();
    expect(emailInput.value).toBeEmpty();

    // This should never be shown for collections.
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
    const signedInCollectionname = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      username: signedInCollectionname,
      email: signedInEmail,
    });
    const name = 'some collection name';

    render({ name }, store);

    // Header.
    expect(screen.getByText(name)).toBeInTheDocument();

    expect(
      screen.getByText(`Report this collection to Mozilla`),
    ).toBeInTheDocument();
    expect(screen.getByText('Submit report')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name (required)');
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue(signedInCollectionname);

    const emailInput = screen.getByLabelText('Your email address (required)');
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue(signedInEmail);

    // This should never be shown for collections.
    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation (optional)',
      }),
    ).not.toBeInTheDocument();

    // SignedInCollection component should be visible.
    expect(
      screen.getByText(`Signed in as ${signedInCollectionname}`),
    ).toBeInTheDocument();

    // We shouldn't show the confirmation message.
    expect(
      screen.queryByClassName('FeedbackForm-success-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it('dispatches sendCollectionAbuseReport action with all fields on submit for a signed-in user', async () => {
    const signedInName = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInName,
      email: signedInEmail,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    const authorId = 1234;
    const collectionId = 98765;
    const collectionSlug = 'some-collection-slug';
    render({ authorId, slug: collectionSlug, id: collectionId }, store);

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendCollectionAbuseReport({
        collectionId,
        errorHandlerId: getErrorHandlerId(authorId, collectionSlug),
        reporterEmail: signedInEmail,
        reporterName: signedInName,
        message: '',
        reason: CATEGORY_SOMETHING_ELSE,
        auth: true,
      }),
    );
  });

  it('dispatches sendCollectionAbuseReport action with all fields on submit for a signed-in user who files the report anonymously', async () => {
    const signedInName = 'signed-in-username';
    const signedInEmail = 'signed-in-email';
    const store = signInUserWithProps({
      display_name: signedInName,
      email: signedInEmail,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    const authorId = 1234;
    const collectionId = 98765;
    const collectionSlug = 'some-collection-slug';
    render({ authorId, slug: collectionSlug, id: collectionId }, store);

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
      sendCollectionAbuseReport({
        collectionId,
        errorHandlerId: getErrorHandlerId(authorId, collectionSlug),
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: CATEGORY_SOMETHING_ELSE,
        auth: false,
      }),
    );
  });

  it('restores the name when the user toggles the anonymous checkbox', async () => {
    const reporterName = 'some reporter name';
    render();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Your name (required)' }),
      reporterName,
    );

    const nameInput = screen.getByLabelText('Your name (required)');
    expect(nameInput).toHaveValue(reporterName);

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'File report anonymously',
      }),
    );
    expect(nameInput).toHaveValue('');

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'File report anonymously',
      }),
    );
    expect(nameInput).toHaveValue(reporterName);
  });

  it('restores the email when the user toggles the anonymous checkbox', async () => {
    const reporterEmail = 'reporter@example.com';
    render();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Your email address (required)' }),
      reporterEmail,
    );

    const emailInput = screen.getByLabelText('Your email address (required)');
    expect(emailInput).toHaveValue(reporterEmail);

    await userEvent.click(
      screen.getByRole('checkbox', {
        email: 'File report anonymously',
      }),
    );
    expect(emailInput).toHaveValue('');

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'File report anonymously',
      }),
    );
    expect(emailInput).toHaveValue(reporterEmail);
  });

  it('renders the different categories for a collection', () => {
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

  it('dispatches sendCollectionAbuseReport with all fields on submit', async () => {
    const authorId = 1234;
    const collectionId = 98765;
    const collectionSlug = 'some-collection-slug';
    const { store } = dispatchClientMetadata();
    const dispatch = jest.spyOn(store, 'dispatch');

    render({ authorId, slug: collectionSlug, id: collectionId }, store);

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
      sendCollectionAbuseReport({
        collectionId,
        errorHandlerId: getErrorHandlerId(authorId, collectionSlug),
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: CATEGORY_FEEDBACK_SPAM,
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
    const collectionId = 456;
    const { store } = dispatchClientMetadata();

    render({ id: collectionId }, store);

    store.dispatch(loadCollectionAbuseReport({ collectionId }));

    expect(
      await screen.findByText(
        'We have received your report. Thanks for letting us know.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Report this collection to Mozilla'),
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
