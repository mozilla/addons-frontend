/* global window */
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { oneLine } from 'common-tags';

import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import {
  CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
  CATEGORY_ILLEGAL,
  CATEGORY_SOMETHING_ELSE,
} from 'amo/components/FeedbackForm';
import { extractId } from 'amo/pages/AddonFeedback';
import { loadAddonAbuseReport, sendAddonAbuseReport } from 'amo/reducers/abuse';
import { FETCH_ADDON, fetchAddon, loadAddon } from 'amo/reducers/addons';
import { makeNonPublicAddon } from 'amo/sagas/addons';
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
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  const defaultUser = { ...fakeAuthors[0], email: 'some-email@example.org' };
  const defaultAddonGUID = '@guid';
  const defaultMessage = 'its bad';
  const defaultLocation = 'both';
  const hatefulReasonLabel = oneLine`It contains hateful, violent, deceptive,
    or other inappropriate content`;
  const illegalReasonLabel = oneLine`It violates the law or contains content
    that violates the law`;
  const defaultLocationLabel = 'Both locations';
  const certificationLabel = oneLine`By submitting this report I certify, under
    penalty of perjury, that the allegations it contains are complete and
    accurate, to the best of my knowledge.`;

  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
    window.scroll = jest.fn();
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

  const getErrorHandlerId = (addonId) =>
    `src/amo/pages/AddonFeedback/index.js-${addonId}`;

  const renderWithoutLoadingAddon = (addonIdentifier) => {
    const renderOptions = {
      initialEntries: [
        `/${lang}/${clientApp}/feedback/addon/${addonIdentifier}/`,
      ],
      store,
    };
    return defaultRender(renderOptions);
  };

  const render = (addonProps = {}) => {
    const addon = {
      ...fakeAddon,
      guid: defaultAddonGUID,
      ...addonProps,
    };
    store.dispatch(loadAddon({ addon, slug: addon.guid }));

    return renderWithoutLoadingAddon(addon.guid);
  };

  it('dispatches fetchAddon when the add-on is not loaded yet', () => {
    const addonIdentifier = 'some-addon-id';
    const dispatch = jest.spyOn(store, 'dispatch');
    const errorHandler = createFakeErrorHandler({
      id: getErrorHandlerId(addonIdentifier),
    });

    renderWithoutLoadingAddon(addonIdentifier);

    expect(dispatch).toHaveBeenCalledWith(
      fetchAddon({
        errorHandler,
        showGroupedRatings: true,
        slug: addonIdentifier,
        assumeNonPublic: true,
      }),
    );
  });

  it('renders feedback form for logged out user with editable name and email', () => {
    const name = createLocalizedString('some add-on name');
    const authors = [...fakeAddon.authors];

    render({ name, authors });

    // Add-on header.
    expect(screen.getByText('some add-on name')).toBeInTheDocument();
    expect(screen.getByText(authors[0].name)).toBeInTheDocument();
    // We should render the `Rating` component too.
    expect(screen.getByClassName('Rating')).toBeInTheDocument();

    expect(screen.getByText('Submit report')).toBeInTheDocument();
    expect(
      screen.getByText(`Report this add-on to Mozilla`),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name (required)');
    expect(nameInput).not.toBeDisabled();
    expect(nameInput.value).toBeEmpty();

    const emailInput = screen.getByLabelText('Your email address (required)');
    expect(emailInput).not.toBeDisabled();
    expect(emailInput.value).toBeEmpty();

    expect(
      screen.queryByClassName('ReportAbuseButton-first-paragraph'),
    ).not.toBeInTheDocument();
  });

  it.each([
    [0, '0 users'],
    [1, '1 user'],
    [123, '123 users'],
  ])(
    'renders the average daily users - average_daily_users=%d',
    (averageDailyUsers, expectedText) => {
      render({ average_daily_users: averageDailyUsers });

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    },
  );

  it.each([{ is_disabled: true }, { status: 'unknown-non-public' }])(
    'does not render metadata for a non-public add-on - %o',
    (addonProps) => {
      render(addonProps);

      expect(
        screen.queryByClassName('AddonFeedbackForm-header-metadata'),
      ).not.toBeInTheDocument();
    },
  );

  it('renders feedback form for logged in user with disabled but prefilled name and email', () => {
    signInUserWithProps();
    render();

    expect(screen.getByText('Submit report')).toBeInTheDocument();
    expect(
      screen.getByText('Report this add-on to Mozilla'),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Your name (required)');
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue(defaultUser.name);

    const emailInput = screen.getByLabelText('Your email address (required)');
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

  it(`renders the different categories for extensions`, () => {
    render({ type: ADDON_TYPE_EXTENSION });

    // A
    expect(screen.getByLabelText(/^It doesn’t work/)).toBeInTheDocument();
    expect(screen.getByText(/^Example: Features are slow/)).toBeInTheDocument();

    // B
    expect(screen.getByLabelText('It’s spam')).toBeInTheDocument();
    expect(screen.getByLabelText('It’s spam')).toBeRequired();
    expect(
      screen.getByText(/^Example: The listing advertises/),
    ).toBeInTheDocument();

    // C
    expect(
      screen.getByLabelText('It violates Add-on Policies'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('It violates Add-on Policies')).toBeRequired();
    expect(screen.getByText(/^Example: It compromised/)).toBeInTheDocument();

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

  it.each([ADDON_TYPE_STATIC_THEME, ADDON_TYPE_DICT])(
    `omit some categories when add-on type is a %s`,
    (addonType) => {
      const addonName = `add-on - ${addonType}`;
      const name = createLocalizedString(addonName);

      render({ name, type: addonType });

      expect(screen.getByText(addonName)).toBeInTheDocument();

      // A - Shouldn't be displayed.
      expect(
        screen.queryByLabelText(/^It doesn’t work/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/^Example: Features are slow/),
      ).not.toBeInTheDocument();

      // B
      expect(screen.getByLabelText('It’s spam')).toBeInTheDocument();
      expect(
        screen.getByText(/^Example: The listing advertises/),
      ).toBeInTheDocument();

      // C - Shouldn't be displayed.
      expect(
        screen.queryByLabelText('It violates Add-on Policies'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/^Example: It compromised/),
      ).not.toBeInTheDocument();

      // D
      expect(screen.getByLabelText(/^It contains hateful/)).toBeInTheDocument();
      expect(
        screen.getByText(/^Example: It contains racist/),
      ).toBeInTheDocument();

      // E
      expect(
        screen.getByLabelText(/^It violates the law /),
      ).toBeInTheDocument();
      expect(screen.getByText(/^Example: Copyright/)).toBeInTheDocument();

      // F
      expect(screen.getByLabelText('Something else')).toBeInTheDocument();
      expect(screen.getByText(/^Anything that doesn’t/)).toBeInTheDocument();
    },
  );

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
        name: 'Place of the violation',
      }),
      defaultLocationLabel,
    );
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: certificationLabel,
      }),
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
      sendAddonAbuseReport({
        errorHandlerId: getErrorHandlerId(defaultAddonGUID),
        addonId: defaultAddonGUID,
        reporterEmail: '',
        reporterName: '',
        message: defaultMessage,
        reason: CATEGORY_ILLEGAL,
        location: defaultLocation,
        auth: false,
      }),
    );
  });

  it('dispatches sendAddonAbuseReport action with all fields on submit for a signed-in user', async () => {
    const name = 'some user name';
    const email = 'some user email';
    signInUserWithProps({ name, email });
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    await userEvent.click(
      screen.getByRole('radio', { name: 'Something else' }),
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', {
        name: 'Place of the violation',
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
        reporterEmail: email,
        reporterName: name,
        message: '',
        reason: CATEGORY_SOMETHING_ELSE,
        location: defaultLocation,
        auth: true,
      }),
    );
  });

  it('dispatches sendAddonAbuseReport action with all fields on submit for a signed-in user who files the report anonymously', async () => {
    signInUserWithProps();
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    await userEvent.click(
      screen.getByRole('radio', { name: illegalReasonLabel }),
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', {
        name: 'Place of the violation',
      }),
      defaultLocationLabel,
    );
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: certificationLabel,
      }),
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
      sendAddonAbuseReport({
        errorHandlerId: getErrorHandlerId(defaultAddonGUID),
        addonId: defaultAddonGUID,
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: CATEGORY_ILLEGAL,
        location: defaultLocation,
        auth: false,
      }),
    );
  });

  it('hides the location field when the does_not_work category is selected', async () => {
    render();

    expect(
      screen.getByRole('combobox', {
        name: 'Place of the violation',
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'It doesn’t work, breaks websites, or slows down Firefox',
      }),
    );

    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation',
      }),
    ).not.toBeInTheDocument();
  });

  it('sets the location to "addon" when the does_not_work category is selected', async () => {
    const dispatch = jest.spyOn(store, 'dispatch');

    render();

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'It doesn’t work, breaks websites, or slows down Firefox',
      }),
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
      sendAddonAbuseReport({
        errorHandlerId: getErrorHandlerId(defaultAddonGUID),
        addonId: defaultAddonGUID,
        reporterEmail: '',
        reporterName: '',
        message: '',
        reason: 'does_not_work',
        location: 'addon',
        auth: false,
      }),
    );
  });

  it('hides the location field when the add-on is not public', async () => {
    render({ status: 'unknown-non-public' });

    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation',
      }),
    ).not.toBeInTheDocument();
  });

  it('hides the location field when the add-on is disabled', async () => {
    render({ is_disabled: true });

    expect(
      screen.queryByRole('combobox', {
        name: 'Place of the violation',
      }),
    ).not.toBeInTheDocument();
  });

  it.each([{ is_disabled: true }, { status: 'unknown-non-public' }])(
    'sets the location to "addon" when add-on is %o',
    async (addonProps) => {
      const addonId = 'some-addon-id';
      const dispatch = jest.spyOn(store, 'dispatch');

      render({ guid: addonId, ...addonProps });

      await userEvent.click(
        screen.getByRole('radio', { name: illegalReasonLabel }),
      );
      await userEvent.click(
        screen.getByRole('checkbox', {
          name: certificationLabel,
        }),
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
        sendAddonAbuseReport({
          errorHandlerId: getErrorHandlerId(addonId),
          addonId,
          reporterEmail: '',
          reporterName: '',
          message: '',
          reason: CATEGORY_ILLEGAL,
          location: 'addon',
          auth: false,
        }),
      );
    },
  );

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
        name: 'Place of the violation',
      }),
      defaultLocationLabel,
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
      sendAddonAbuseReport({
        errorHandlerId: getErrorHandlerId(defaultAddonGUID),
        addonId: defaultAddonGUID,
        reporterEmail: '',
        reporterName: '',
        message: defaultMessage,
        reason: CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
        location: defaultLocation,
        addonVersion: version,
        auth: false,
      }),
    );
  });

  it('shows success message after submission', async () => {
    const guid = 'some-addon@guid';
    render({ guid });

    store.dispatch(
      loadAddonAbuseReport({
        addon: { ...fakeAddon, guid },
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
    await userEvent.selectOptions(
      screen.getByRole('combobox', {
        name: 'Place of the violation',
      }),
      defaultLocationLabel,
    );
    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Provide more details (optional)',
      }),
      defaultMessage,
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

  it('disables the submit button when no reason selected', async () => {
    render();

    expect(
      screen.getByRole('button', { name: 'Submit report' }),
    ).toBeDisabled();
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
    // navigates to the feedback form page and, in both cases, the scroll will
    // be at the top of the page.
    expect(window.scroll).not.toHaveBeenCalled();
  });

  it('does not fetch the user when there is an error', () => {
    const addonIdentifier = 'some-addon-id';
    createFailedErrorHandler({ id: getErrorHandlerId(addonIdentifier), store });
    const dispatch = jest.spyOn(store, 'dispatch');

    renderWithoutLoadingAddon(addonIdentifier);

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
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

  it('renders a header with the installed add-on name', () => {
    const name = createLocalizedString('some add-on name');
    const installedAddonName = 'installed add-on name';
    store.dispatch(
      setInstallState({ guid: defaultAddonGUID, name: installedAddonName }),
    );
    render({ name });

    expect(screen.queryByText('some add-on name')).not.toBeInTheDocument();
    expect(screen.getByText(installedAddonName)).toBeInTheDocument();
  });

  it("renders a header with the add-on name when the installed add-on doesn't have one", () => {
    const name = createLocalizedString('some add-on name');
    store.dispatch(setInstallState({ guid: defaultAddonGUID, name: null }));
    render({ name });

    expect(screen.getByText('some add-on name')).toBeInTheDocument();
  });

  it('does not render a header when the add-on is non-public and not installed', () => {
    const slug = 'some-non-public-addon@guid';
    store.dispatch(loadAddon({ addon: makeNonPublicAddon(slug), slug }));
    renderWithoutLoadingAddon(slug);

    expect(
      screen.queryByClassName('AddonFeedbackForm-header'),
    ).not.toBeInTheDocument();
  });

  it('renders a header with the add-on name that looks like a GUID', () => {
    const name = createLocalizedString(defaultAddonGUID);
    render({ name });

    expect(screen.getByText(defaultAddonGUID)).toBeInTheDocument();
    expect(
      screen.getByClassName('AddonFeedbackForm-header'),
    ).toBeInTheDocument();
  });

  it.each([true, false])(
    'marks the name and email fields as required or optional depending on the anonymous flag - withSignedInUser=%s',
    async (withSignedInUser) => {
      if (withSignedInUser) {
        signInUserWithProps();
      }
      render();

      // By default, name/email fields are required and marked as such (for
      // accessibility reasons). These fields can be disabled when the current
      // user is signed-in.
      let nameInput = screen.getByLabelText('Your name (required)');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput.disabled).toEqual(withSignedInUser);

      let emailInput = screen.getByLabelText('Your email address (required)');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.disabled).toEqual(withSignedInUser);

      expect(
        screen.queryByLabelText('Your name (optional)'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('Your email address (optional)'),
      ).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('checkbox', {
          name: 'File report anonymously',
        }),
      );

      // When the user wants to file a report anonymously, we disable the
      // name/email fields and mark them as optional for accessibility reasons.
      expect(
        screen.queryByLabelText('Your name (required)'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('Your email address (required)'),
      ).not.toBeInTheDocument();

      nameInput = screen.getByLabelText('Your name (optional)');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toBeDisabled();

      emailInput = screen.getByLabelText('Your email address (optional)');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toBeDisabled();
    },
  );
});
