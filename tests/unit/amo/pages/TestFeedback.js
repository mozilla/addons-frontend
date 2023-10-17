/* global window */
import config from 'config';
import userEvent from '@testing-library/user-event';

import { setViewContext } from 'amo/actions/viewContext';
import { createApiError } from 'amo/api/index';
import { extractId, getCategories } from 'amo/pages/Feedback';
import { CLIENT_APP_FIREFOX, VIEW_CONTEXT_HOME } from 'amo/constants';
import { clearError } from 'amo/reducers/errors';
import { sendAddonAbuseReport } from 'amo/reducers/abuse';
import {
  createFailedErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
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
  const defaultName = 'Display McDisplayNamey';
  const defaultEmail = 'otheruser@mozilla.com';
  const defaultUserId = fakeAuthors[0].id;
  const defaultAddonGUID = '@guid';
  const defaultReason = 'hate_speech';
  const defaultReasonLabel =
    'It contains hateful, violent, deceptive, or other inappropriate content';
  const defaultMessage = 'its bad';
  let store;
  let fakeConfig;

  const savedLocation = window.location;

  beforeEach(() => {
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

  function defaultUserProps(props = {}) {
    return {
      name: defaultName,
      email: defaultEmail,
      ...props,
    };
  }

  function signInUserWithProps({ userId = defaultUserId, ...props } = {}) {
    dispatchSignInActionsWithStore({
      userId,
      userProps: defaultUserProps(props),
      store,
    });
    return userId;
  }

  const getLocation = (addonGUID) => {
    return `/${lang}/${clientApp}/feedback/addon/${addonGUID}/`;
  };

  const getErrorHandlerId = (addonIdentifier) =>
    `src/amo/pages/Feedback/index.js-${addonIdentifier}`;

  const render = ({ location, addonGUID = defaultAddonGUID } = {}) => {
    const renderOptions = {
      initialEntries: [location || getLocation(addonGUID)],
      store,
    };
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });
    const renderResults = defaultRender(renderOptions);
    return renderResults;
  };

  it('renders feedback form for logged out user with editable name and email', () => {
    render();

    expect(screen.getByText('Submit report')).toBeInTheDocument();
    expect(
      screen.getByText(`Send some feedback about an add-on`),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Your Email Address')).not.toBeDisabled();
    expect(screen.getByLabelText('Your Full Name')).not.toBeDisabled();

    expect(
      screen.queryByClassName('ReportAbuseButton-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it('renders feedback form for logged in user with disabled but prefilled name and email', () => {
    signInUserWithProps();
    render();

    expect(screen.getByText('Submit report')).toBeInTheDocument();
    expect(
      screen.getByText(`Send some feedback about an add-on`),
    ).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Your Email Address');
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue(fakeAuthors[0].displayName);
    const nameInput = screen.getByLabelText('Your Full Name');
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue(fakeAuthors[0].email);

    expect(
      screen.queryByClassName('ReportAbuseButton-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['report', 'policy_violation'],
    ['report', 'hate_speech'],
    ['report', 'illegal'],
    ['report', 'other'],
    ['feedback', 'does_not_work'],
    ['feedback', 'not_wanted'],
  ])(`renders reason %s`, (category, reason_slug) => {
    const categories = getCategories(fakeI18n());
    const reason = categories[category].find(
      (item) => reason_slug === item.value,
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
        name: 'Give details of your feedback or report',
      }),
      defaultMessage,
    );
    await userEvent.click(
      screen.getByRole('radio', { name: defaultReasonLabel }),
    );
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      sendAddonAbuseReport({
        errorHandlerId: getErrorHandlerId(defaultAddonGUID),
        addonSlug: defaultAddonGUID,
        reporter_email: '',
        reporter_name: '',
        message: defaultMessage,
        reason: defaultReason,
      }),
    );
  });

  it('renders a submit button with a different text when updating', async () => {
    render();
    await userEvent.click(
      screen.getByRole('radio', { name: defaultReasonLabel }),
    );
    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Give details of your feedback or report',
      }),
      defaultMessage,
    );
    await userEvent.click(screen.getByRole('checkbox'));

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

  it('renders a not found page if the API request is a 404', () => {
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

  it('dispatches setViewContext when component mounts', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(setViewContext(VIEW_CONTEXT_HOME));
  });
});
