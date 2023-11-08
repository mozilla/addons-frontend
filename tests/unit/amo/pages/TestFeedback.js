/* global window */
import config from 'config';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { oneLine } from 'common-tags';

import { createApiError } from 'amo/api/index';
import { getCategories } from 'amo/components/FeedbackForm';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { extractId } from 'amo/pages/Feedback';
import { loadAddonAbuseReport, sendAddonAbuseReport } from 'amo/reducers/abuse';
import { loadAddon, fetchAddon } from 'amo/reducers/addons';
import { clearError } from 'amo/reducers/errors';
import { setInstallState } from 'amo/reducers/installations';
import {
  createFailedErrorHandler,
  createFakeErrorHandler,
  createLocalizedString,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAddon,
  fakeAuthors,
  fakeI18n,
  getMockConfig,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

jest.mock('config');

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  const defaultUser = { ...fakeAuthors[0], email: 'some-email@example.org' };
  const defaultAddonGUID = '@guid';
  const hatefulReason = 'hateful_violent_deceptive';
  const hatefulReasonLabel = oneLine`It contains hateful, violent, deceptive,
    or other inappropriate content`;
  const illegalReason = 'illegal';
  const illegalReasonLabel = oneLine`It violates the law or contains content
    that violates the law`;
  const defaultMessage = 'its bad';
  const defaultLocation = 'both';
  const defaultLocationLabel = 'Both locations';
  const defaultAddonName = 'some add-on name';
  const certificationLabel = oneLine`By submitting this report I certify, under
    penalty of perjury, that the allegations it contains are complete and
    accurate, to the best of my knowledge.`;

  const savedLocation = window.location;

  let store;
  let fakeConfig;
  let addon;

  beforeEach(() => {
    addon = {
      ...fakeAddon,
      name: createLocalizedString(defaultAddonName),
      guid: defaultAddonGUID,
    };
    store = dispatchClientMetadata({ clientApp, lang }).store;
    delete window.location;
    window.location = Object.assign(new URL('https://example.org'), {
      assign: jest.fn(),
    });
    window.scroll = jest.fn();
    fakeConfig = getMockConfig({
      enableFeatureFeedbackForm: true,
    });
  });

  afterEach(() => {
    window.location = savedLocation;
  });

  function signInUserWithProps({ userId, ...props } = {}) {
    const { id, ...userProps } = defaultUser;

    dispatchSignInActionsWithStore({
      userId: userId || id,
      userProps: { ...userProps, ...props },
      store,
    });
    return userId;
  }

  const getLocation = (addonGUID) => {
    return `/${lang}/${clientApp}/feedback/addon/${addonGUID}/`;
  };

  const getErrorHandlerId = (addonId) =>
    `src/amo/pages/Feedback/index.js-${addonId}`;

  const renderWithoutLoadingAddon = ({
    location,
    addonGUID = defaultAddonGUID,
  } = {}) => {
    const renderOptions = {
      initialEntries: [location || getLocation(addonGUID)],
      store,
    };
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });
    return defaultRender(renderOptions);
  };

  const render = ({ location, addonGUID = defaultAddonGUID } = {}) => {
    store.dispatch(loadAddon({ addon, slug: addonGUID }));
    return renderWithoutLoadingAddon({ location, addonGUID });
  };

  it('dispatches fetchAddon if addonId is not found', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const errorHandler = createFakeErrorHandler({
      id: getErrorHandlerId(defaultAddonGUID),
    });
    renderWithoutLoadingAddon();

    expect(dispatch).toHaveBeenCalledWith(
      fetchAddon({
        errorHandler,
        slug: defaultAddonGUID,
        assumeNonPublic: true,
      }),
    );
  });

  it('renders feedback form for logged out user with editable name and email', () => {
    render();

    // Add-on header.
    expect(screen.getByText(defaultAddonName)).toBeInTheDocument();
    expect(screen.getByText(addon.authors[0].name)).toBeInTheDocument();

    expect(screen.getByText('Submit report')).toBeInTheDocument();
    expect(
      screen.getByText(`Report this add-on to Mozilla`),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Your name(optional)')).not.toBeDisabled();
    expect(screen.getByLabelText('Your name(optional)').value).toBeEmpty();
    expect(
      screen.getByLabelText('Your email address(optional)'),
    ).not.toBeDisabled();
    expect(
      screen.getByLabelText('Your email address(optional)').value,
    ).toBeEmpty();

    expect(
      screen.queryByClassName('ReportAbuseButton-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it('renders feedback form for logged in user with disabled but prefilled name and email', () => {
    signInUserWithProps();
    render();

    expect(screen.getByText('Submit report')).toBeInTheDocument();
    expect(
      screen.getByText('Report this add-on to Mozilla'),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name');
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue(defaultUser.name);

    const emailInput = screen.getByLabelText('Your email address');
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue(defaultUser.email);

    // SignedInUser component should be visible.
    expect(
      screen.getByText(`Signed in as ${defaultUser.name}`),
    ).toBeInTheDocument();

    expect(
      screen.queryByClassName('ReportAbuseButton-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['report', 'policy_violation'],
    ['report', 'hateful_violent_deceptive'],
    ['report', 'illegal'],
    ['report', 'other'],
    ['feedback', 'does_not_work'],
    ['feedback', 'feedback_spam'],
  ])(`renders reason %s`, (category, reasonSlug) => {
    const categories = getCategories(fakeI18n());
    const reason = categories[category].find(
      (item) => reasonSlug === item.value,
    );
    render();

    expect(screen.getByLabelText(reason.label)).toBeInTheDocument();
    expect(screen.getByText(reason.help)).toBeInTheDocument();
  });

  it('dispatches sendAddonAbuseReport action with all fields on submit', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Provide more details (optional)',
      }),
      defaultMessage,
    );
    await userEvent.click(
      screen.getByRole('radio', { name: illegalReasonLabel }),
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', {
        name: 'Place of the violation (optional)',
      }),
      defaultLocationLabel,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendAddonAbuseReport({
        errorHandlerId: getErrorHandlerId(defaultAddonGUID),
        addonId: defaultAddonGUID,
        reporterEmail: '',
        reporterName: '',
        message: defaultMessage,
        reason: illegalReason,
        location: defaultLocation,
      }),
    );
  });

  it('shows a certification checkbox when the chosen reason requires it', async () => {
    render();

    expect(screen.queryByLabelText(certificationLabel)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('radio', { name: illegalReasonLabel }),
    );

    expect(screen.getByLabelText(certificationLabel)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );

    expect(screen.queryByLabelText(certificationLabel)).not.toBeInTheDocument();
  });

  it('sends the installed add-on version when available', async () => {
    const version = '2.4.5';
    store.dispatch(
      setInstallState({
        guid: defaultAddonGUID,
        version,
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Provide more details (optional)',
      }),
      defaultMessage,
    );
    await userEvent.click(
      screen.getByRole('radio', { name: hatefulReasonLabel }),
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', {
        name: 'Place of the violation (optional)',
      }),
      defaultLocationLabel,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendAddonAbuseReport({
        errorHandlerId: getErrorHandlerId(defaultAddonGUID),
        addonId: defaultAddonGUID,
        reporterEmail: '',
        reporterName: '',
        message: defaultMessage,
        reason: hatefulReason,
        location: defaultLocation,
        addonVersion: version,
      }),
    );
  });

  it('shows success message after submission', async () => {
    render();

    store.dispatch(
      loadAddonAbuseReport({
        addon: fakeAddon,
        message: defaultMessage,
        reporter: null,
      }),
    );

    expect(
      await screen.findByText(
        'We have received your report. Thanks for letting us know.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Report this add-on to Mozilla'),
    ).not.toBeInTheDocument();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('renders a submit button with a different text when updating', async () => {
    render();
    await userEvent.click(
      screen.getByRole('radio', { name: hatefulReasonLabel }),
    );
    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Provide more details (optional)',
      }),
      defaultMessage,
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

  it('disables the submit button when no reason selected', async () => {
    render();

    expect(
      screen.getByRole('button', { name: 'Submit report' }),
    ).toBeDisabled();
  });

  it('renders a Not Found page when enableFeatureFeedbackForm is false', () => {
    fakeConfig = { ...fakeConfig, enableFeatureFeedbackForm: false };
    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders errors', () => {
    const message = 'Some error message';
    createFailedErrorHandler({
      id: getErrorHandlerId(defaultAddonGUID),
      message,
      store,
    });

    render();

    expect(screen.getByText(message)).toBeInTheDocument();

    // We do not call `scroll()` here because we mount the component and
    // `componentDidUpdate()` is not called. It is valid because we only mount
    // the component when the server processes the request OR the user
    // navigates to the edit profile page and, in both cases, the scroll will
    // be at the top of the page.
    expect(window.scroll).not.toHaveBeenCalled();
  });

  it('renders a not found page if the API response is a 404', () => {
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
      }),
      id: getErrorHandlerId(defaultAddonGUID),
      store,
    });

    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      expect(
        extractId({ match: { params: { addonIdentifier: defaultAddonGUID } } }),
      ).toEqual(defaultAddonGUID);
    });
  });

  it('scrolls to the top of the page when an error is rendered', async () => {
    render();

    createFailedErrorHandler({
      id: getErrorHandlerId(defaultAddonGUID),
      store,
    });

    await waitFor(() => expect(window.scroll).toHaveBeenCalledWith(0, 0));
  });

  it('clears the error handler when unmounting', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    createFailedErrorHandler({
      id: getErrorHandlerId(defaultAddonGUID),
      store,
    });
    const { unmount } = render();

    unmount();

    expect(dispatch).toHaveBeenCalledWith(
      clearError(getErrorHandlerId(defaultAddonGUID)),
    );
  });
});
