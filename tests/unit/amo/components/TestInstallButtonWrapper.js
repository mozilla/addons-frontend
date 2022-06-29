import * as React from 'react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { encode } from 'universal-base64url';

import {
  GET_FIREFOX_BUTTON_CLICK_ACTION,
  GET_FIREFOX_BUTTON_CLICK_CATEGORY,
  getDownloadLink,
  getDownloadCampaign,
} from 'amo/components/GetFirefoxButton';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ENABLE_ACTION,
  ERROR,
  ERROR_CORRUPT_FILE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  INACTIVE,
  INSTALLED,
  INSTALLING,
  INSTALL_ACTION,
  INSTALL_CANCELLED,
  INSTALL_CANCELLED_ACTION,
  INSTALL_DOWNLOAD_FAILED_ACTION,
  INSTALL_ERROR,
  INSTALL_FAILED,
  INSTALL_STARTED_ACTION,
  SET_ENABLE_NOT_AVAILABLE,
  START_DOWNLOAD,
  TRACKING_TYPE_INVALID,
  UNINSTALLED,
  UNINSTALLING,
  UNINSTALL_ACTION,
} from 'amo/constants';
import { makeProgressHandler } from 'amo/installAddon';
import { setInstallError, setInstallState } from 'amo/reducers/installations';
import { loadVersions } from 'amo/reducers/versions';
import tracking, {
  getAddonTypeForTracking,
  getAddonEventCategory,
} from 'amo/tracking';
import {
  createFakeTracking,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeFile,
  fakeInstalledAddon,
  fakeVersion,
  getFakeAddonManagerWrapper,
  getFakeLoggerWithJest as getFakeLogger,
  render as defaultRender,
  screen,
  userAgents,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

jest.mock('amo/tracking', () => ({
  ...jest.requireActual('amo/tracking'),
  sendEvent: jest.fn(),
}));

const INVALID_TYPE = 'not-a-real-type';

describe(__filename, () => {
  let addon;
  let store;
  let _addonManager;
  let _getClientCompatibility;

  beforeEach(() => {
    _getClientCompatibility = jest.fn().mockReturnValue({ compatible: true });
    addon = { ...fakeAddon };
    store = dispatchClientMetadata().store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = ({ addonManagerOverrides = {}, ...props } = {}) => {
    _addonManager = getFakeAddonManagerWrapper(addonManagerOverrides);
    return defaultRender(
      <InstallButtonWrapper
        addon={createInternalAddonWithLang(addon)}
        _addonManager={_addonManager}
        _getClientCompatibility={_getClientCompatibility}
        {...props}
      />,
      {
        store,
      },
    );
  };

  const _loadVersion = ({ version = addon.current_version } = {}) => {
    store.dispatch(
      loadVersions({
        slug: addon.slug,
        versions: [version],
      }),
    );
  };

  const renderWithCurrentVersion = ({ ...props } = {}) => {
    _loadVersion();
    render({ ...props });
  };

  const _dispatchClientMetadata = (params = {}) => {
    return dispatchClientMetadata({
      store,
      userAgent: userAgentsByPlatform.mac.firefox57,
      ...params,
    });
  };

  it(`calls getClientCompatibility with the add-on's current version if no version is supplied`, () => {
    const clientApp = CLIENT_APP_FIREFOX;

    _dispatchClientMetadata({
      clientApp,
    });

    renderWithCurrentVersion();

    expect(_getClientCompatibility).toHaveBeenCalledWith({
      addon: createInternalAddonWithLang(addon),
      clientApp,
      currentVersion: createInternalVersionWithLang(addon.current_version),
      userAgentInfo: store.getState().api.userAgentInfo,
    });
  });

  it(`calls getClientCompatibility with a specific version if supplied`, () => {
    const version = { ...fakeVersion, id: fakeVersion.id + 1 };

    _loadVersion({ version });

    const clientApp = CLIENT_APP_FIREFOX;

    _dispatchClientMetadata({
      clientApp,
    });

    render({
      version: createInternalVersionWithLang(version),
    });

    expect(_getClientCompatibility).toHaveBeenCalledWith({
      addon: createInternalAddonWithLang(addon),
      clientApp,
      currentVersion: createInternalVersionWithLang(version),
      userAgentInfo: store.getState().api.userAgentInfo,
    });
  });

  it('does not call getClientCompatibility when the browser is not Firefox', () => {
    const clientApp = CLIENT_APP_FIREFOX;

    _dispatchClientMetadata({
      clientApp,
      userAgent: userAgentsByPlatform.mac.chrome41,
    });

    render();

    expect(_getClientCompatibility).not.toHaveBeenCalled();
  });

  it.each(['unknown reason', INCOMPATIBLE_UNDER_MIN_VERSION])(
    'hides the install button and shows the download button for an incompatible addon when the reason is %s',
    (reason) => {
      const version = { ...fakeVersion, id: fakeVersion.id + 1 };

      _loadVersion({ version });

      const clientApp = CLIENT_APP_FIREFOX;
      _getClientCompatibility = jest.fn().mockReturnValue({
        compatible: false,
        reason,
      });

      _dispatchClientMetadata({
        clientApp,
      });

      render({
        version: createInternalVersionWithLang(version),
      });

      expect(
        screen.getByRole('link', {
          name: 'Download the new Firefox and get the extension',
        }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Add to Firefox')).not.toBeInTheDocument();
    },
  );

  it.each([
    INCOMPATIBLE_ANDROID_UNSUPPORTED,
    INCOMPATIBLE_FIREFOX_FOR_IOS,
    INCOMPATIBLE_NOT_FIREFOX,
    INCOMPATIBLE_OVER_MAX_VERSION,
    INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  ])(
    'hides the download button and shows the install button for an incompatible addon when the reason is %s',
    (reason) => {
      const version = { ...fakeVersion, id: fakeVersion.id + 1 };

      _loadVersion({ version });

      const clientApp = CLIENT_APP_FIREFOX;
      _getClientCompatibility = jest.fn().mockReturnValue({
        compatible: false,
        reason,
      });

      _dispatchClientMetadata({ clientApp });

      render({
        version: createInternalVersionWithLang(version),
      });

      expect(
        screen.getByRole('link', { name: 'Add to Firefox' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Download the new Firefox and get the extension'),
      ).not.toBeInTheDocument();
    },
  );

  it('hides the AMInstallButton when the browser is not Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });

    render();

    expect(screen.queryByText('Add to Firefox')).not.toBeInTheDocument();
  });

  it('passes an add-on to AMInstallButton', () => {
    addon.type = ADDON_TYPE_STATIC_THEME;

    render();

    expect(
      screen.getByRole('button', { name: 'Install Theme' }),
    ).toBeInTheDocument();
  });

  it('passes a null currentVersion to AMInstallButton when no version is loaded', () => {
    render();

    const button = screen.getByRole('button', { name: 'Add to Firefox' });
    expect(button).toHaveAttribute('disabled');
    expect(button).not.toHaveAttribute('href');
  });

  it('passes a currentVersion to AMInstallButton when one is loaded', () => {
    renderWithCurrentVersion();

    expect(
      screen.getByRole('link', { name: 'Add to Firefox' }),
    ).toHaveAttribute('href', addon.current_version.url);
  });

  it('passes a currentVersion to AMInstallButton when one is specified', () => {
    const url = 'https://some/url';
    const version = createInternalVersionWithLang({
      ...fakeVersion,
      file: { ...fakeFile, url },
      id: addon.current_version.id + 1,
    });

    render({
      version,
    });

    expect(
      screen.getByRole('link', { name: 'Add to Firefox' }),
    ).toHaveAttribute('href', url);
  });

  it('passes disabled to AMInstallButton based on what is returned from _getClientCompatibility', () => {
    render({
      version: createInternalVersionWithLang(fakeVersion),
      addonManagerOverrides: { hasAddonManager: false },
    });

    expect(
      screen.getByRole('link', { name: 'Add to Firefox' }),
    ).not.toHaveAttribute('disabled');
  });

  it('passes the expected status to AMInstallButton when the add-on is installed', () => {
    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        status: INSTALLED,
      }),
    );

    render({
      version: createInternalVersionWithLang(fakeVersion),
      addonManagerOverrides: { hasAddonManager: false },
    });

    expect(screen.getByRole('link', { name: 'Remove' })).not.toHaveAttribute(
      'disabled',
    );
  });

  it('passes the canUninstall prop from the installation state to AMInstallButton', () => {
    const canUninstall = true;

    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        canUninstall,
      }),
    );

    render({
      version: createInternalVersionWithLang(fakeVersion),
    });

    expect(screen.getByRole('link', { name: 'Remove' })).not.toHaveAttribute(
      'disabled',
    );
  });

  it('passes the expected status to AMInstallButton when the add-on is not installed', () => {
    render();

    expect(
      screen.getByRole('button', { name: 'Add to Firefox' }),
    ).toHaveAttribute('disabled');
  });

  it('passes an add-on to GetFirefoxButton', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });
    const encodedGUID = encode(addon.guid);
    const expectedHref = [
      'https://www.mozilla.org/firefox/download/thanks/?s=direct',
      'utm_campaign=amo-fx-cta-1234',
      `utm_content=rta%3A${encodedGUID}`,
      'utm_medium=referral',
      'utm_source=addons.mozilla.org',
    ].join('&');

    render();

    expect(
      screen.getByRole('link', { name: 'Download Firefox' }),
    ).toHaveAttribute('href', expectedHref);
  });

  it('passes a custom className to AMInstallButton', () => {
    const className = 'some-class';
    render({ className });

    expect(screen.getByClassName('AMInstallButton')).toHaveClass(
      `AMInstallButton--${className}`,
    );
  });

  it('passes a custom className to GetFirefoxButton', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });
    const className = 'some-class';
    render({ className });

    expect(screen.getByClassName('GetFirefoxButton')).toHaveClass(
      `GetFirefoxButton--${className}`,
    );
  });

  it('displays a download link when the browser is not compatible', () => {
    _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
    });
    render({
      version: createInternalVersionWithLang(addon.current_version),
    });

    expect(
      screen.getByRole('link', { name: 'Download file' }),
    ).toBeInTheDocument();
  });

  it('does not display a download link when the browser is compatible and showLinkInsteadOfButton is false', () => {
    render({
      version: createInternalVersionWithLang(addon.current_version),
      showLinkInsteadOfButton: false,
    });

    expect(
      screen.queryByRole('link', { name: 'Download file' }),
    ).not.toBeInTheDocument();
  });

  it('displays a download link when the browser is compatible and showLinkInsteadOfButton is true', () => {
    render({
      version: createInternalVersionWithLang(addon.current_version),
      showLinkInsteadOfButton: true,
    });

    expect(
      screen.getByRole('link', { name: 'Download file' }),
    ).toBeInTheDocument();
  });

  it('does not display a button when the browser is compatible and showLinkInsteadOfButton is true', () => {
    render({
      version: createInternalVersionWithLang(addon.current_version),
      showLinkInsteadOfButton: true,
    });

    expect(screen.queryByText('Add to Firefox')).not.toBeInTheDocument();
  });

  it('adds a special classname when no download link is displayed', () => {
    render({
      version: createInternalVersionWithLang(addon.current_version),
    });

    expect(screen.getByClassName('AMInstallButton')).toHaveClass(
      'AMInstallButton--noDownloadLink',
    );
  });

  it('does not add a special classname when a download link is displayed', () => {
    _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
      reason: INCOMPATIBLE_ANDROID_UNSUPPORTED,
    });

    render({
      version: createInternalVersionWithLang(addon.current_version),
    });

    expect(screen.getByClassName('AMInstallButton')).not.toHaveClass(
      'AMInstallButton--noDownloadLink',
    );
  });

  it('uses the file url in the download link', () => {
    _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
    });
    const fileURL = 'https://addons.mozilla.org/files/addon.xpi';

    render({
      version: createInternalVersionWithLang({
        ...addon.current_version,
        file: { ...fakeFile, url: fileURL },
      }),
    });

    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'href',
      fileURL,
    );
  });

  it('does not display a download link when there is no currentVersion', () => {
    _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
    });
    render({ version: null });

    expect(
      screen.queryByRole('link', { name: 'Download file' }),
    ).not.toBeInTheDocument();
  });

  describe('Tests for GetFirefoxButton', () => {
    const getFirefoxButton = () =>
      screen.getByRole('link', {
        name: 'Download Firefox and get the extension',
      });

    const renderAsIncompatible = (props = {}) => {
      _getClientCompatibility = jest.fn().mockReturnValue({
        compatible: false,
        reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      });
      _dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
        userAgent: userAgents.firefox[0],
      });
      return render(props);
    };

    describe('On firefox', () => {
      it('renders nothing if the browser is Firefox Desktop', () => {
        _dispatchClientMetadata({ userAgent: userAgents.firefox[0] });
        render();

        expect(
          screen.queryByRole('link', {
            name: 'Download Firefox and get the extension',
          }),
        ).not.toBeInTheDocument();
      });

      it('renders nothing if the browser is Firefox for Android', () => {
        _dispatchClientMetadata({ userAgent: userAgents.firefoxAndroid[0] });
        render();

        expect(
          screen.queryByRole('link', { name: 'Download Firefox' }),
        ).not.toBeInTheDocument();
      });

      it('renders nothing if the browser is Firefox for iOS', () => {
        _dispatchClientMetadata({ userAgent: userAgents.firefoxIOS[0] });
        render();

        expect(
          screen.queryByRole('link', { name: 'Download Firefox' }),
        ).not.toBeInTheDocument();
      });

      it('renders a GetFirefoxButton if forIncompatibleAddon is true', () => {
        renderAsIncompatible();

        expect(
          screen.getByRole('link', {
            name: 'Download the new Firefox and get the extension',
          }),
        ).toBeInTheDocument();
      });
    });

    describe('Not firefox', () => {
      const clientApp = CLIENT_APP_FIREFOX;

      beforeEach(() => {
        _dispatchClientMetadata({
          clientApp,
          userAgent: userAgents.chrome[0],
        });
      });

      it('renders a GetFirefoxButton if the browser is not Firefox', () => {
        render();

        expect(getFirefoxButton()).toBeInTheDocument();
      });

      it('has the expected button text when client is Android', () => {
        // The default clientApp is `CLIENT_APP_ANDROID`.
        _dispatchClientMetadata({ userAgent: userAgents.chrome[0] });
        render();

        expect(
          screen.getByRole('link', { name: 'Download Firefox' }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for an extension', () => {
        render();

        expect(
          screen.getByRole('link', {
            name: 'Download Firefox and get the extension',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for a theme', () => {
        addon.type = ADDON_TYPE_STATIC_THEME;

        render();

        expect(
          screen.getByRole('link', {
            name: 'Download Firefox and get the theme',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for an extension, which is incompatible', () => {
        renderAsIncompatible();

        expect(
          screen.getByRole('link', {
            name: 'Download the new Firefox and get the extension',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for a theme, which is incompatible', () => {
        addon.type = ADDON_TYPE_STATIC_THEME;

        renderAsIncompatible();

        expect(
          screen.getByRole('link', {
            name: 'Download the new Firefox and get the theme',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for an extension', () => {
        render();

        expect(
          screen.getByText(`You'll need Firefox to use this extension`),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for an extension, which is incompatible', () => {
        renderAsIncompatible();

        expect(
          screen.getByText(
            'You need an updated version of Firefox for this extension',
          ),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for a theme', () => {
        addon.type = ADDON_TYPE_STATIC_THEME;

        render();

        expect(
          screen.getByText(`You'll need Firefox to use this theme`),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for a theme, which is incompatible', () => {
        addon.type = ADDON_TYPE_STATIC_THEME;

        renderAsIncompatible();

        expect(
          screen.getByText(
            'You need an updated version of Firefox for this theme',
          ),
        ).toBeInTheDocument();
      });

      it('sends a tracking event when the button is clicked', async () => {
        render();

        await userEvent.click(getFirefoxButton());

        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(tracking.sendEvent).toHaveBeenCalledWith({
          action: GET_FIREFOX_BUTTON_CLICK_ACTION,
          category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
          label: addon.guid,
        });
      });
    });

    describe('getDownloadCampaign', () => {
      it('returns a campaign without an addonId', () => {
        expect(getDownloadCampaign()).toEqual(DOWNLOAD_FIREFOX_UTM_CAMPAIGN);
      });

      it('returns a campaign with an addonId', () => {
        const addonId = 12345;
        expect(getDownloadCampaign({ addonId })).toEqual(
          `${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}-${addonId}`,
        );
      });
    });

    describe('getDownloadLink', () => {
      const guid = 'some-guid';

      it('includes and overrides params via overrideQueryParams', () => {
        const param1 = 'test';
        const utm_campaign = 'overridden_utm_campaign';
        const link = getDownloadLink({
          overrideQueryParams: { param1, utm_campaign },
        });
        expect(link.includes(`param1=${param1}`)).toEqual(true);
        expect(link.includes(`utm_campaign=${utm_campaign}`)).toEqual(true);
      });

      it('calls universal-base64url.encode to encode the guid of the add-on for utm_content', () => {
        addon.guid = guid;
        const encodedGuid = encode(guid);
        const _encode = jest.fn().mockReturnValue(encodedGuid);
        const link = getDownloadLink({
          _encode,
          addon: createInternalAddonWithLang(addon),
        });

        expect(_encode).toHaveBeenCalledWith(guid);
        expect(link.includes(`utm_content=rta%3A${encodedGuid}`)).toEqual(true);
      });

      // See: https://github.com/mozilla/addons-frontend/issues/7255
      it('does not call universal-base64url.encode when add-on has a `null` GUID', () => {
        addon.guid = null;
        const _encode = jest.fn();
        const link = getDownloadLink({
          _encode,
          addon: createInternalAddonWithLang(addon),
        });

        expect(_encode).not.toHaveBeenCalled();
        expect(link.includes('utm_content')).toEqual(false);
      });

      it('calls getDownloadCampaign with an add-on to populate utm_campaign', () => {
        const addonId = 123;
        addon.id = addonId;
        const campaign = 'some_campaign';
        const _getDownloadCampaign = jest.fn().mockReturnValue(campaign);

        const link = getDownloadLink({
          _getDownloadCampaign,
          addon: createInternalAddonWithLang(addon),
        });

        expect(_getDownloadCampaign).toHaveBeenCalledWith({ addonId });
        expect(link.includes(`utm_campaign=${campaign}`)).toEqual(true);
      });

      it('calls getDownloadCampaign without an add-on to populate utm_campaign', () => {
        const campaign = 'some_campaign';
        const _getDownloadCampaign = jest.fn().mockReturnValue(campaign);

        const link = getDownloadLink({
          _getDownloadCampaign,
          addon: undefined,
        });

        expect(_getDownloadCampaign).toHaveBeenCalledWith({
          addonId: undefined,
        });
        expect(link.includes(`utm_campaign=${campaign}`)).toEqual(true);
      });

      // Note: This is a sanity test for the entire URL string. Each of the
      // individual tests above test separate pieces of logic.
      it('returns the expected URL for an add-on', () => {
        const addonId = 123;
        addon.id = addonId;
        addon.guid = guid;

        const expectedLink = [
          `${DOWNLOAD_FIREFOX_BASE_URL}?s=direct`,
          `utm_campaign=${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}-${addonId}`,
          `utm_content=rta%3A${encode(guid)}`,
          `utm_medium=referral&utm_source=addons.mozilla.org`,
        ].join('&');

        expect(
          getDownloadLink({ addon: createInternalAddonWithLang(addon) }),
        ).toEqual(expectedLink);
      });
    });
  });

  describe('Tests for withInstallHelpers', () => {
    it('calls getAddon() when the component is rendered', () => {
      renderWithCurrentVersion();

      expect(_addonManager.getAddon).toHaveBeenCalledWith(addon.guid);
    });

    it('does not call getAddon() if we do not have an addonManager', () => {
      renderWithCurrentVersion({
        addonManagerOverrides: { hasAddonManager: false },
      });

      expect(_addonManager.getAddon).not.toHaveBeenCalled();
    });

    it('does not call getAddon() if we do not have an addon', () => {
      render({ addon: null });

      expect(_addonManager.getAddon).not.toHaveBeenCalled();

      // We didn't render a proper install button wrapper.
      expect(
        screen.queryByClassName('InstallButtonWrapper'),
      ).not.toBeInTheDocument();
    });

    const successfulGetAddonMock = (getAddonOverrides = {}) =>
      Promise.resolve({
        isActive: true,
        isEnabled: true,
        ...getAddonOverrides,
      });

    describe('setCurrentStatus', () => {
      it.each([
        [ADDON_TYPE_EXTENSION, 'enabled', ENABLED, successfulGetAddonMock()],
        [
          ADDON_TYPE_EXTENSION,
          'disabled',
          DISABLED,
          successfulGetAddonMock({ isEnabled: false }),
        ],
        [
          ADDON_TYPE_EXTENSION,
          'disabled and inactive',
          DISABLED,
          successfulGetAddonMock({ isActive: false, isEnabled: false }),
        ],
        [
          ADDON_TYPE_EXTENSION,
          'enabled but inactive',
          INACTIVE,
          successfulGetAddonMock({ isActive: false }),
        ],
        [ADDON_TYPE_STATIC_THEME, 'enabled', ENABLED, successfulGetAddonMock()],
        [
          ADDON_TYPE_STATIC_THEME,
          'disabled',
          DISABLED,
          successfulGetAddonMock({ isEnabled: false }),
        ],
        [
          ADDON_TYPE_STATIC_THEME,
          'disabled and inactive',
          DISABLED,
          successfulGetAddonMock({ isActive: false, isEnabled: false }),
        ],
        [
          ADDON_TYPE_STATIC_THEME,
          'enabled but inactive',
          DISABLED,
          successfulGetAddonMock({ isActive: false }),
        ],
      ])(
        'when a(n) %s is %s, sets the status to %s',
        async (type, statusDesc, expectedStatus, getAddon) => {
          addon.type = type;
          const installURL = addon.current_version.file.url;
          const addonManagerOverrides = { getAddon };
          const dispatch = jest.spyOn(store, 'dispatch');

          renderWithCurrentVersion({ addonManagerOverrides });

          await waitFor(() => {
            expect(dispatch).toHaveBeenCalledTimes(2);
          });

          expect(dispatch).toHaveBeenCalledWith(
            setInstallState({
              canUninstall: undefined,
              guid: addon.guid,
              status: expectedStatus,
              url: installURL,
            }),
          );
        },
      );

      it('sets the status to UNINSTALLED when an extension is not found', async () => {
        const installURL = addon.current_version.file.url;
        const addonManagerOverrides = {
          getAddon: Promise.reject(),
        };

        const dispatch = jest.spyOn(store, 'dispatch');

        renderWithCurrentVersion({ addonManagerOverrides });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: UNINSTALLED,
            url: installURL,
          }),
        );
      });

      it('dispatches error when setCurrentStatus gets exception', async () => {
        const addonManagerOverrides = {
          // Resolve a null addon which will trigger an exception.
          getAddon: Promise.resolve(null),
        };

        const dispatch = jest.spyOn(store, 'dispatch');

        renderWithCurrentVersion({ addonManagerOverrides });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            guid: addon.guid,
            status: ERROR,
            error: FATAL_ERROR,
          }),
        );
      });

      it('does nothing when addon is `null`', () => {
        const _log = getFakeLogger();

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _log, addon: null });

        expect(dispatch).not.toHaveBeenCalled();
        expect(_log.debug).toHaveBeenCalledWith(
          'no addon, aborting setCurrentStatus()',
        );
      });

      it('does nothing when currentVersion is `null`', () => {
        const _log = getFakeLogger();

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _log });

        expect(dispatch).not.toHaveBeenCalled();
        expect(_log.debug).toHaveBeenCalledWith(
          'no currentVersion, aborting setCurrentStatus()',
        );
      });

      it('sets the canUninstall prop', async () => {
        const installURL = addon.current_version.file.url;
        const canUninstall = false;
        const addonManagerOverrides = {
          getAddon: Promise.resolve({
            canUninstall,
            isActive: true,
            isEnabled: true,
          }),
        };

        const dispatch = jest.spyOn(store, 'dispatch');

        renderWithCurrentVersion({ addonManagerOverrides });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall,
            guid: addon.guid,
            status: ENABLED,
            url: installURL,
          }),
        );
      });
    });

    describe('makeProgressHandler', () => {
      const createProgressHandler = (props = {}) => {
        return makeProgressHandler({
          _tracking: createFakeTracking(),
          dispatch: jest.fn(),
          guid: 'some-guid',
          name: 'some-name',
          type: ADDON_TYPE_EXTENSION,
          ...props,
        });
      };

      it('sets the download progress on STATE_DOWNLOADING', () => {
        const dispatch = jest.fn();
        const guid = 'foo@addon';
        const handler = createProgressHandler({ dispatch, guid });

        handler({
          state: 'STATE_DOWNLOADING',
          progress: 300,
          maxProgress: 990,
        });
        expect(dispatch).toHaveBeenCalledWith({
          type: DOWNLOAD_PROGRESS,
          payload: { downloadProgress: 30, guid },
        });
      });

      it('sets status to error on onDownloadFailed', () => {
        const _tracking = createFakeTracking();
        const dispatch = jest.fn();
        const guid = '{my-addon}';
        const name = 'my-addon';
        const type = ADDON_TYPE_EXTENSION;
        const handler = createProgressHandler({
          _tracking,
          dispatch,
          guid,
          name,
          type,
        });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadFailed' });

        expect(dispatch).toHaveBeenCalledWith({
          type: INSTALL_ERROR,
          payload: { guid, error: DOWNLOAD_FAILED },
        });
        expect(_tracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, INSTALL_DOWNLOAD_FAILED_ACTION),
          label: guid,
        });
      });

      it('sets status to installing onDownloadEnded', () => {
        const dispatch = jest.fn();
        const guid = '{my-addon}';
        const handler = createProgressHandler({ dispatch, guid });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadEnded' });
        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            guid,
            status: INSTALLING,
          }),
        );
      });

      it('resets status to uninstalled on onInstallCancelled', () => {
        const _tracking = createFakeTracking();
        const dispatch = jest.fn();
        const guid = '{my-addon}';
        const name = 'my-addon';
        const type = ADDON_TYPE_EXTENSION;
        const handler = createProgressHandler({
          _tracking,
          dispatch,
          guid,
          name,
          type,
        });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallCancelled' });

        expect(dispatch).toHaveBeenCalledWith({
          type: INSTALL_CANCELLED,
          payload: { guid },
        });
        expect(_tracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, INSTALL_CANCELLED_ACTION),
          label: guid,
        });
      });

      it('sets status to error on onInstallFailed', () => {
        const dispatch = jest.fn();
        const guid = '{my-addon}';
        const handler = createProgressHandler({ dispatch, guid });

        handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallFailed' });
        expect(dispatch).toHaveBeenCalledWith({
          type: INSTALL_ERROR,
          payload: { guid, error: INSTALL_FAILED },
        });
      });

      it('does nothing on unknown events', () => {
        const _tracking = createFakeTracking();
        const dispatch = jest.fn();
        const guid = 'foo@addon';
        const handler = createProgressHandler({ dispatch, guid });

        handler({ state: 'WAT' }, { type: 'onNothingPerformed' });
        expect(dispatch).not.toHaveBeenCalled();
        expect(_tracking.sendEvent).not.toHaveBeenCalled();
      });

      it('sets status to error when file appears to be corrupt', () => {
        const _tracking = createFakeTracking();
        const dispatch = jest.fn();
        const guid = '{my-addon}';
        const name = 'my-addon';
        const type = ADDON_TYPE_EXTENSION;
        const handler = createProgressHandler({
          _tracking,
          dispatch,
          guid,
          name,
          type,
        });

        handler(
          { state: 'STATE_SOMETHING' },
          { type: 'onDownloadFailed', target: { error: ERROR_CORRUPT_FILE } },
        );

        expect(dispatch).toHaveBeenCalledWith({
          type: INSTALL_ERROR,
          payload: { guid, error: ERROR_CORRUPT_FILE },
        });
        expect(_tracking.sendEvent).not.toHaveBeenCalled();
      });
    });

    describe('enable', () => {
      it('calls addonManager.enable()', async () => {
        const fakeTracking = createFakeTracking();
        const addonManagerOverrides = {
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        };

        renderWithCurrentVersion({
          addonManagerOverrides,
          _tracking: fakeTracking,
        });

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Enable' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Enable' }));

        expect(_addonManager.enable).toHaveBeenCalledWith(addon.guid);

        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
          category: getAddonEventCategory(ADDON_TYPE_EXTENSION, ENABLE_ACTION),
          label: addon.guid,
        });
      });

      it('dispatches a FATAL_ERROR', async () => {
        const addonManagerOverrides = {
          enable: jest.fn().mockRejectedValue(new Error('hai')),
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        };

        const dispatch = jest.spyOn(store, 'dispatch');

        renderWithCurrentVersion({
          addonManagerOverrides,
        });

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Enable' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Enable' }));

        expect(_addonManager.enable).toHaveBeenCalledWith(addon.guid);

        await waitFor(() =>
          expect(dispatch).toHaveBeenCalledWith(
            setInstallState({
              guid: addon.guid,
              status: ERROR,
              error: FATAL_ERROR,
            }),
          ),
        );
      });

      it('does not dispatch a FATAL_ERROR when setEnabled is missing', async () => {
        const addonManagerOverrides = {
          enable: jest
            .fn()
            .mockRejectedValue(new Error(SET_ENABLE_NOT_AVAILABLE)),
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        };

        const dispatch = jest.spyOn(store, 'dispatch');

        renderWithCurrentVersion({
          addonManagerOverrides,
        });

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Enable' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Enable' }));

        expect(_addonManager.enable).toHaveBeenCalledWith(addon.guid);

        expect(dispatch).not.toHaveBeenCalledWith(
          setInstallState({
            guid: addon.guid,
            status: ERROR,
            error: FATAL_ERROR,
          }),
        );
      });
    });

    describe('install', () => {
      it('calls addonManager.install()', async () => {
        const addonManagerOverrides = {
          // Simulate the add-on not being installed already.
          getAddon: Promise.reject(),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
        });

        const button = screen.getByRole('link', { name: 'Add to Firefox' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(_addonManager.install).toHaveBeenCalledWith(
          addon.current_version.file.url,
          expect.any(Function),
          { hash: addon.current_version.file.hash },
        );
      });

      it('uses a version instead of the currentVersion when one exists in props', async () => {
        const versionHash = 'version-hash';
        const versionInstallURL = 'https://mysite.com/download-version.xpi';

        const addonManagerOverrides = {
          // Simulate the add-on not being installed already.
          getAddon: Promise.reject(),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
          version: createInternalVersionWithLang({
            ...fakeVersion,
            file: {
              ...fakeFile,
              hash: versionHash,
              url: versionInstallURL,
            },
          }),
        });

        const button = screen.getByRole('link', { name: 'Add to Firefox' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(_addonManager.install).toHaveBeenCalledWith(
          versionInstallURL,
          expect.any(Function),
          { hash: versionHash },
        );
      });

      it('tracks the start of an addon install', async () => {
        const fakeTracking = createFakeTracking();

        const addonManagerOverrides = {
          getAddon: Promise.reject(),
          // Make the install fail so that we can be sure only
          // the 'start' event gets tracked.
          install: jest.fn().mockRejectedValue(new Error('install error')),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
          _tracking: fakeTracking,
        });
        const button = screen.getByRole('link', { name: 'Add to Firefox' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(_addonManager.install).toHaveBeenCalled();

        expect(fakeTracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
          category: getAddonEventCategory(
            ADDON_TYPE_EXTENSION,
            INSTALL_STARTED_ACTION,
          ),
          label: addon.guid,
        });
      });

      it('tracks an addon install', async () => {
        const fakeTracking = createFakeTracking();

        const addonManagerOverrides = {
          getAddon: Promise.reject(),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
          _tracking: fakeTracking,
        });
        const button = screen.getByRole('link', { name: 'Add to Firefox' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(_addonManager.install).toHaveBeenCalled();

        await waitFor(() =>
          expect(fakeTracking.sendEvent).toHaveBeenCalledTimes(2),
        );
        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
          category: getAddonEventCategory(
            ADDON_TYPE_EXTENSION,
            INSTALL_STARTED_ACTION,
          ),
          label: addon.guid,
        });
        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
          category: getAddonEventCategory(ADDON_TYPE_EXTENSION, INSTALL_ACTION),
          label: addon.guid,
        });
      });

      it('tracks the start of a static theme install', async () => {
        const fakeTracking = createFakeTracking();
        addon.type = ADDON_TYPE_STATIC_THEME;

        const addonManagerOverrides = {
          getAddon: Promise.reject(),
          // Make the install fail so that we can be sure only
          // the 'start' event gets tracked.
          install: jest.fn().mockRejectedValue(new Error('install error')),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
          _tracking: fakeTracking,
        });
        const button = screen.getByRole('link', { name: 'Install Theme' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(_addonManager.install).toHaveBeenCalled();

        expect(fakeTracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME),
          category: getAddonEventCategory(
            ADDON_TYPE_STATIC_THEME,
            INSTALL_STARTED_ACTION,
          ),
          label: addon.guid,
        });
      });

      it('tracks a static theme install', async () => {
        const fakeTracking = createFakeTracking();
        addon.type = ADDON_TYPE_STATIC_THEME;

        const addonManagerOverrides = {
          getAddon: Promise.reject(),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
          _tracking: fakeTracking,
        });
        const button = screen.getByRole('link', { name: 'Install Theme' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(_addonManager.install).toHaveBeenCalled();

        await waitFor(() =>
          expect(fakeTracking.sendEvent).toHaveBeenCalledTimes(2),
        );
        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME),
          category: getAddonEventCategory(
            ADDON_TYPE_STATIC_THEME,
            INSTALL_STARTED_ACTION,
          ),
          label: addon.guid,
        });
        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME),
          category: getAddonEventCategory(
            ADDON_TYPE_STATIC_THEME,
            INSTALL_ACTION,
          ),
          label: addon.guid,
        });
      });

      it('should dispatch START_DOWNLOAD', async () => {
        const dispatch = jest.spyOn(store, 'dispatch');

        const addonManagerOverrides = {
          getAddon: Promise.reject(),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
        });
        const button = screen.getByRole('link', { name: 'Add to Firefox' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(dispatch).toHaveBeenCalledWith({
          type: START_DOWNLOAD,
          payload: { guid: addon.guid },
        });
      });

      it('dispatches error when addonManager.install throws', async () => {
        const dispatch = jest.spyOn(store, 'dispatch');

        const addonManagerOverrides = {
          getAddon: Promise.reject(),
          install: jest.fn().mockRejectedValue(new Error('install error')),
        };
        renderWithCurrentVersion({
          addonManagerOverrides,
        });
        const button = screen.getByRole('link', { name: 'Add to Firefox' });

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        await userEvent.click(button);

        expect(_addonManager.install).toHaveBeenCalled();

        await waitFor(() =>
          expect(dispatch).toHaveBeenCalledWith(
            setInstallError({
              error: FATAL_INSTALL_ERROR,
              guid: addon.guid,
            }),
          ),
        );
      });
    });

    describe('uninstall', () => {
      it('calls addonManager.uninstall()', async () => {
        const dispatch = jest.spyOn(store, 'dispatch');

        renderWithCurrentVersion();

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Remove' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Remove' }));

        expect(_addonManager.uninstall).toHaveBeenCalledWith(addon.guid);

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({ guid: addon.guid, status: UNINSTALLING }),
        );
      });

      it('dispatches error when addonManager.uninstall throws', async () => {
        const addonManagerOverrides = {
          uninstall: jest
            .fn()
            .mockRejectedValue(new Error('Add-on Manager uninstall error')),
        };

        const dispatch = jest.spyOn(store, 'dispatch');

        renderWithCurrentVersion({ addonManagerOverrides });

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Remove' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Remove' }));

        expect(_addonManager.uninstall).toHaveBeenCalledWith(addon.guid);

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({ guid: addon.guid, status: UNINSTALLING }),
        );
        await waitFor(() =>
          expect(dispatch).toHaveBeenCalledWith(
            setInstallError({
              guid: addon.guid,
              error: FATAL_UNINSTALL_ERROR,
            }),
          ),
        );
      });

      it('tracks an addon uninstall', async () => {
        const fakeTracking = createFakeTracking();

        renderWithCurrentVersion({
          _tracking: fakeTracking,
        });

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Remove' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Remove' }));

        expect(_addonManager.uninstall).toHaveBeenCalledWith(addon.guid);

        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
          category: getAddonEventCategory(
            ADDON_TYPE_EXTENSION,
            UNINSTALL_ACTION,
          ),
          label: addon.guid,
        });
      });

      it('tracks a static theme uninstall', async () => {
        const fakeTracking = createFakeTracking();
        addon.type = ADDON_TYPE_STATIC_THEME;

        renderWithCurrentVersion({
          _tracking: fakeTracking,
        });

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Remove' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Remove' }));

        expect(_addonManager.uninstall).toHaveBeenCalledWith(addon.guid);

        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_STATIC_THEME),
          category: getAddonEventCategory(
            ADDON_TYPE_STATIC_THEME,
            UNINSTALL_ACTION,
          ),
          label: addon.guid,
        });
      });

      it('tracks a unknown type uninstall', async () => {
        const fakeTracking = createFakeTracking();
        addon.type = INVALID_TYPE;

        renderWithCurrentVersion({
          _tracking: fakeTracking,
        });

        await waitFor(() => {
          expect(
            screen.getByRole('link', { name: 'Remove' }),
          ).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('link', { name: 'Remove' }));

        expect(_addonManager.uninstall).toHaveBeenCalledWith(addon.guid);

        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: TRACKING_TYPE_INVALID,
          category: getAddonEventCategory(INVALID_TYPE, UNINSTALL_ACTION),
          label: addon.guid,
        });
      });
    });
  });
});
