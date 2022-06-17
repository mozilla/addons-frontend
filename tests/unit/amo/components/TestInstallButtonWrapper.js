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
  createFakeTrackingWithJest,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeFile,
  fakeInstalledAddon,
  fakeTheme,
  fakeVersion,
  getFakeAddonManagerWrapperWithJest as getFakeAddonManagerWrapper,
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
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = ({
    addon = createInternalAddonWithLang(fakeAddon),
    ...props
  } = {}) => {
    return defaultRender(<InstallButtonWrapper addon={addon} {...props} />, {
      store,
    });
  };

  const _loadVersions = ({ slug, versions } = {}) => {
    store.dispatch(
      loadVersions({
        slug,
        versions,
      }),
    );
  };

  const _dispatchClientMetadata = (params = {}) => {
    return dispatchClientMetadata({
      store,
      userAgent: userAgentsByPlatform.mac.firefox57,
      ...params,
    });
  };

  it(`calls getClientCompatibility with the add-on's current version if no version is supplied`, () => {
    const addon = fakeAddon;

    _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

    const clientApp = CLIENT_APP_FIREFOX;
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    _dispatchClientMetadata({
      clientApp,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
    });

    expect(_getClientCompatibility).toHaveBeenCalledWith({
      addon: createInternalAddonWithLang(addon),
      clientApp,
      currentVersion: createInternalVersionWithLang(addon.current_version),
      userAgentInfo: store.getState().api.userAgentInfo,
    });
  });

  it(`calls getClientCompatibility with a specific version if supplied`, () => {
    const slug = 'some-slug';
    const addon = { ...fakeAddon, slug };
    const version = { ...fakeVersion, id: fakeVersion.id + 1 };

    _loadVersions({ slug, versions: [version] });

    const clientApp = CLIENT_APP_FIREFOX;
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    _dispatchClientMetadata({
      clientApp,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
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
    const addon = fakeAddon;

    const clientApp = CLIENT_APP_FIREFOX;
    const _getClientCompatibility = jest.fn();

    _dispatchClientMetadata({
      clientApp,
      userAgent: userAgentsByPlatform.mac.chrome41,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
    });

    expect(_getClientCompatibility).not.toHaveBeenCalled();
  });

  it.each(['unknown reason', INCOMPATIBLE_UNDER_MIN_VERSION])(
    'hides the install button and shows the download button for an incompatible addon when the reason is %s',
    (reason) => {
      const slug = 'some-slug';
      const addon = { ...fakeAddon, slug };
      const version = { ...fakeVersion, id: fakeVersion.id + 1 };

      _loadVersions({ slug, versions: [version] });

      const clientApp = CLIENT_APP_FIREFOX;
      const _getClientCompatibility = jest.fn().mockReturnValue({
        compatible: false,
        reason,
      });

      _dispatchClientMetadata({
        clientApp,
      });

      render({
        _getClientCompatibility,
        addon: createInternalAddonWithLang(addon),
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
      const slug = 'some-slug';
      const addon = { ...fakeAddon, slug };
      const version = { ...fakeVersion, id: fakeVersion.id + 1 };

      _loadVersions({ slug, versions: [version] });

      const clientApp = CLIENT_APP_FIREFOX;
      const _getClientCompatibility = jest.fn().mockReturnValue({
        compatible: false,
        reason,
      });

      _dispatchClientMetadata({ clientApp });

      render({
        _getClientCompatibility,
        addon: createInternalAddonWithLang(addon),
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
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });

    render({ addon });

    expect(
      screen.getByRole('button', { name: 'Install Theme' }),
    ).toBeInTheDocument();
  });

  it('passes a null currentVersion to AMInstallButton when no version is loaded', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    render({ addon });

    const button = screen.getByRole('button', { name: 'Add to Firefox' });
    expect(button).toHaveAttribute('disabled');
    expect(button).not.toHaveAttribute('href');
  });

  it('passes a currentVersion to AMInstallButton when one is loaded', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });
    const addon = fakeAddon;

    _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
    });

    expect(
      screen.getByRole('link', { name: 'Add to Firefox' }),
    ).toHaveAttribute('href', addon.current_version.url);
  });

  it('passes a currentVersion to AMInstallButton when one is specified', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });
    const url = 'https://some/url';
    const version = createInternalVersionWithLang({
      ...fakeVersion,
      file: { ...fakeFile, url },
      id: fakeAddon.current_version.id + 1,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(fakeAddon),
      version,
    });

    expect(
      screen.getByRole('link', { name: 'Add to Firefox' }),
    ).toHaveAttribute('href', url);
  });

  it('passes disabled to AMInstallButton based on what is returned from _getClientCompatibility', () => {
    const addon = fakeAddon;

    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
      version: createInternalVersionWithLang(fakeVersion),
    });

    expect(
      screen.getByRole('link', { name: 'Add to Firefox' }),
    ).not.toHaveAttribute('disabled');
  });

  it('passes the expected status to AMInstallButton when the add-on is installed', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    const addon = fakeAddon;

    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        status: INSTALLED,
      }),
    );

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
      version: createInternalVersionWithLang(fakeVersion),
    });

    expect(screen.getByRole('link', { name: 'Remove' })).not.toHaveAttribute(
      'disabled',
    );
  });

  it('passes the canUninstall prop from the installation state to AMInstallButton', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    const addon = fakeAddon;
    const canUninstall = true;

    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        canUninstall,
      }),
    );

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
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
    const addon = createInternalAddonWithLang(fakeAddon);
    const encodedGUID = encode(addon.guid);
    const expectedHref = [
      'https://www.mozilla.org/firefox/download/thanks/?s=direct',
      'utm_campaign=amo-fx-cta-1234',
      `utm_content=rta%3A${encodedGUID}`,
      'utm_medium=referral',
      'utm_source=addons.mozilla.org',
    ].join('&');

    render({ addon });

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
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
    });

    render({
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(
      screen.getByRole('link', { name: 'Download file' }),
    ).toBeInTheDocument();
  });

  it('does not display a download link when the browser is compatible and showLinkInsteadOfButton is false', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    render({
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
      showLinkInsteadOfButton: false,
    });

    expect(
      screen.queryByRole('link', { name: 'Download file' }),
    ).not.toBeInTheDocument();
  });

  it('displays a download link when the browser is compatible and showLinkInsteadOfButton is true', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    render({
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
      showLinkInsteadOfButton: true,
    });

    expect(
      screen.getByRole('link', { name: 'Download file' }),
    ).toBeInTheDocument();
  });

  it('does not display a button when the browser is compatible and showLinkInsteadOfButton is true', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    render({
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
      showLinkInsteadOfButton: true,
    });

    expect(screen.queryByText('Add to Firefox')).not.toBeInTheDocument();
  });

  it('adds a special classname when no download link is displayed', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: true,
    });

    render({
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(screen.getByClassName('AMInstallButton')).toHaveClass(
      'AMInstallButton--noDownloadLink',
    );
  });

  it('does not add a special classname when a download link is displayed', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
      reason: INCOMPATIBLE_ANDROID_UNSUPPORTED,
    });

    render({
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(screen.getByClassName('AMInstallButton')).not.toHaveClass(
      'AMInstallButton--noDownloadLink',
    );
  });

  it('uses the file url in the download link', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
    });
    const fileURL = 'https://addons.mozilla.org/files/addon.xpi';

    render({
      _getClientCompatibility,
      version: createInternalVersionWithLang({
        ...fakeAddon.current_version,
        file: { ...fakeFile, url: fileURL },
      }),
    });

    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'href',
      fileURL,
    );
  });

  it('does not display a download link when there is no currentVersion', () => {
    const _getClientCompatibility = jest.fn().mockReturnValue({
      compatible: false,
    });
    render({ _getClientCompatibility, version: null });

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
      const _getClientCompatibility = jest.fn().mockReturnValue({
        compatible: false,
        reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      });
      _dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
        userAgent: userAgents.firefox[0],
      });
      return render({ _getClientCompatibility, ...props });
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
        render({
          addon: createInternalAddonWithLang(fakeAddon),
        });

        expect(
          screen.getByRole('link', { name: 'Download Firefox' }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for an extension', () => {
        render({
          addon: createInternalAddonWithLang(fakeAddon),
        });

        expect(
          screen.getByRole('link', {
            name: 'Download Firefox and get the extension',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for a theme', () => {
        render({
          addon: createInternalAddonWithLang(fakeTheme),
        });

        expect(
          screen.getByRole('link', {
            name: 'Download Firefox and get the theme',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for an extension, which is incompatible', () => {
        renderAsIncompatible({
          addon: createInternalAddonWithLang(fakeAddon),
        });

        expect(
          screen.getByRole('link', {
            name: 'Download the new Firefox and get the extension',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected button text for a theme, which is incompatible', () => {
        renderAsIncompatible({
          addon: createInternalAddonWithLang(fakeTheme),
        });

        expect(
          screen.getByRole('link', {
            name: 'Download the new Firefox and get the theme',
          }),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for an extension', () => {
        render({
          addon: createInternalAddonWithLang(fakeAddon),
        });

        expect(
          screen.getByText(`You'll need Firefox to use this extension`),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for an extension, which is incompatible', () => {
        renderAsIncompatible({
          addon: createInternalAddonWithLang(fakeAddon),
        });

        expect(
          screen.getByText(
            'You need an updated version of Firefox for this extension',
          ),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for a theme', () => {
        render({
          addon: createInternalAddonWithLang(fakeTheme),
        });

        expect(
          screen.getByText(`You'll need Firefox to use this theme`),
        ).toBeInTheDocument();
      });

      it('has the expected callout text for a theme, which is incompatible', () => {
        renderAsIncompatible({
          addon: createInternalAddonWithLang(fakeTheme),
        });

        expect(
          screen.getByText(
            'You need an updated version of Firefox for this theme',
          ),
        ).toBeInTheDocument();
      });

      it('sends a tracking event when the button is clicked', () => {
        const guid = 'some-guid';
        const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
        render({ addon });

        userEvent.click(getFirefoxButton());

        expect(tracking.sendEvent).toHaveBeenCalledTimes(1);
        expect(tracking.sendEvent).toHaveBeenCalledWith({
          action: GET_FIREFOX_BUTTON_CLICK_ACTION,
          category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
          label: guid,
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
        const encodedGuid = encode(guid);
        const _encode = sinon.stub().returns(encodedGuid);
        const addon = createInternalAddonWithLang({ ...fakeAddon, guid });

        const link = getDownloadLink({ _encode, addon });

        sinon.assert.calledWith(_encode, addon.guid);
        expect(link.includes(`utm_content=rta%3A${encodedGuid}`)).toEqual(true);
      });

      // See: https://github.com/mozilla/addons-frontend/issues/7255
      it('does not call universal-base64url.encode when add-on has a `null` GUID', () => {
        const _encode = sinon.spy();
        const addon = createInternalAddonWithLang({ ...fakeAddon, guid: null });

        const link = getDownloadLink({ _encode, addon });

        sinon.assert.notCalled(_encode);
        expect(link.includes('utm_content')).toEqual(false);
      });

      it('calls getDownloadCampaign with an add-on to populate utm_campaign', () => {
        const addonId = 123;
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          id: addonId,
        });
        const campaign = 'some_campaign';
        const _getDownloadCampaign = sinon.stub().returns(campaign);

        const link = getDownloadLink({ _getDownloadCampaign, addon });

        sinon.assert.calledWith(_getDownloadCampaign, { addonId });
        expect(link.includes(`utm_campaign=${campaign}`)).toEqual(true);
      });

      it('calls getDownloadCampaign without an add-on to populate utm_campaign', () => {
        const addon = undefined;
        const campaign = 'some_campaign';
        const _getDownloadCampaign = sinon.stub().returns(campaign);

        const link = getDownloadLink({ _getDownloadCampaign, addon });

        sinon.assert.calledWith(_getDownloadCampaign, { addonId: undefined });
        expect(link.includes(`utm_campaign=${campaign}`)).toEqual(true);
      });

      // Note: This is a sanity test for the entire URL string. Each of the
      // individual tests above test separate pieces of logic.
      it('returns the expected URL for an add-on', () => {
        const addonId = 123;
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          id: addonId,
        });

        const expectedLink = [
          `${DOWNLOAD_FIREFOX_BASE_URL}?s=direct`,
          `utm_campaign=${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}-${addonId}`,
          `utm_content=rta%3A${encode(addon.guid)}`,
          `utm_medium=referral&utm_source=addons.mozilla.org`,
        ].join('&');

        expect(getDownloadLink({ addon })).toEqual(expectedLink);
      });
    });
  });

  describe('Tests for withInstallHelpers', () => {
    it('calls getAddon() when the component is rendered', () => {
      const addon = fakeAddon;
      _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

      const _addonManager = getFakeAddonManagerWrapper();

      render({ _addonManager });

      expect(_addonManager.getAddon).toHaveBeenCalledWith(addon.guid);
    });

    it('does not call getAddon() if we do not have an addonManager', () => {
      const addon = fakeAddon;
      _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

      const _addonManager = getFakeAddonManagerWrapper({
        hasAddonManager: false,
      });

      render({ _addonManager });

      expect(_addonManager.getAddon).not.toHaveBeenCalled();
    });

    it('does not call getAddon() if we do not have an addon', () => {
      const _addonManager = getFakeAddonManagerWrapper();

      render({ _addonManager, addon: null });

      expect(_addonManager.getAddon).not.toHaveBeenCalled();

      // Basic expectation proving rendering didn't fail
      expect(screen.getByTagName('div')).toBeInTheDocument();

      // We didn't render a proper install button wrapper though.
      expect(
        screen.queryByClassName('InstallButtonWrapper'),
      ).not.toBeInTheDocument();
    });

    describe('setCurrentStatus', () => {
      it('sets the status to ENABLED when an extension is enabled', async () => {
        const addon = fakeAddon;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper();

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: ENABLED,
            url: installURL,
          }),
        );
      });

      it('sets the status to DISABLED when an extension is disabled', async () => {
        const addon = fakeAddon;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: DISABLED,
            url: installURL,
          }),
        );
      });

      it('sets the status to DISABLED when an extension is disabled and inactive', async () => {
        const addon = fakeAddon;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: false,
          }),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: DISABLED,
            url: installURL,
          }),
        );
      });

      it('sets the status to INACTIVE when an extension is enabled but inactive', async () => {
        const addon = fakeAddon;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: true,
          }),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: INACTIVE,
            url: installURL,
          }),
        );
      });

      it('sets the status to ENABLED when a theme is enabled', async () => {
        const addon = fakeTheme;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: true,
          }),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({
          _addonManager: fakeAddonManager,
          addon: createInternalAddonWithLang(addon),
        });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: ENABLED,
            url: installURL,
          }),
        );
      });

      it('sets the status to DISABLED when a theme is enabled but inactive', async () => {
        const addon = fakeTheme;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: true,
          }),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({
          _addonManager: fakeAddonManager,
          addon: createInternalAddonWithLang(addon),
        });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: DISABLED,
            url: installURL,
          }),
        );
      });

      it('sets the status to DISABLED when a theme is disabled', async () => {
        const addon = fakeTheme;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({
          _addonManager: fakeAddonManager,
          addon: createInternalAddonWithLang(addon),
        });

        await waitFor(() => {
          expect(dispatch).toHaveBeenCalledTimes(2);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            canUninstall: undefined,
            guid: addon.guid,
            status: DISABLED,
            url: installURL,
          }),
        );
      });

      it('sets the status to UNINSTALLED when an extension is not found', async () => {
        const addon = fakeAddon;
        const installURL = addon.current_version.file.url;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager });

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
        const addon = fakeAddon;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          // Resolve a null addon which will trigger an exception.
          getAddon: Promise.resolve(null),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager });

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
        const fakeAddonManager = getFakeAddonManagerWrapper();

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager, _log, addon: null });

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(_log.debug).toHaveBeenCalledWith(
          'no addon, aborting setCurrentStatus()',
        );
      });

      it('does nothing when currentVersion is `null`', () => {
        const _log = getFakeLogger();
        const fakeAddonManager = getFakeAddonManagerWrapper();

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager, _log });

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(_log.debug).toHaveBeenCalledWith(
          'no currentVersion, aborting setCurrentStatus()',
        );
      });

      it('sets the canUninstall prop', async () => {
        const addon = fakeAddon;
        const installURL = addon.current_version.file.url;
        const canUninstall = false;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            canUninstall,
            isActive: true,
            isEnabled: true,
          }),
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager });

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
          _tracking: createFakeTrackingWithJest(),
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
        const _tracking = createFakeTrackingWithJest();
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
        const _tracking = createFakeTrackingWithJest();
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
        const _tracking = createFakeTrackingWithJest();
        const dispatch = jest.fn();
        const guid = 'foo@addon';
        const handler = createProgressHandler({ dispatch, guid });

        handler({ state: 'WAT' }, { type: 'onNothingPerformed' });
        expect(_tracking.sendEvent).not.toHaveBeenCalled();
      });

      it('sets status to error when file appears to be corrupt', () => {
        const _tracking = createFakeTrackingWithJest();
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
        const addon = fakeAddon;
        const fakeTracking = createFakeTrackingWithJest();
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        });
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });
        render({
          _addonManager: fakeAddonManager,
          _tracking: fakeTracking,
          _getClientCompatibility,
        });

        await waitFor(() => {
          expect(screen.getByText('Enable')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Enable'));

        await waitFor(() => {
          expect(fakeAddonManager.enable).toHaveBeenCalledWith(addon.guid);
        });

        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: getAddonTypeForTracking(ADDON_TYPE_EXTENSION),
          category: getAddonEventCategory(ADDON_TYPE_EXTENSION, ENABLE_ACTION),
          label: addon.guid,
        });
      });

      it('dispatches a FATAL_ERROR', async () => {
        const addon = fakeAddon;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          enable: jest.fn().mockRejectedValue(new Error('hai')),
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        });
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
        });

        await waitFor(() => {
          expect(screen.getByText('Enable')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Enable'));

        await waitFor(() => {
          expect(fakeAddonManager.enable).toHaveBeenCalledWith(addon.guid);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({
            guid: addon.guid,
            status: ERROR,
            error: FATAL_ERROR,
          }),
        );
      });

      it('does not dispatch a FATAL_ERROR when setEnabled is missing', async () => {
        const addon = fakeAddon;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          enable: jest
            .fn()
            .mockRejectedValue(new Error(SET_ENABLE_NOT_AVAILABLE)),
          getAddon: Promise.resolve({
            isActive: true,
            isEnabled: false,
          }),
        });
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
        });

        await waitFor(() => {
          expect(screen.getByText('Enable')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Enable'));

        await waitFor(() => {
          expect(fakeAddonManager.enable).toHaveBeenCalledWith(addon.guid);
        });

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
        const addon = fakeAddon;
        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        const fakeAddonManager = getFakeAddonManagerWrapper({
          // Simulate the add-on not being installed already.
          getAddon: Promise.reject(),
        });
        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
        });

        const button = screen.getByText('Add to Firefox');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        await waitFor(() => {
          expect(fakeAddonManager.install).toHaveBeenCalledWith(
            addon.current_version.file.url,
            expect.any(Function),
            { hash: addon.current_version.file.hash },
          );
        });
      });

      it('uses a version instead of the currentVersion when one exists in props', async () => {
        const addon = fakeAddon;
        const versionHash = 'version-hash';
        const versionInstallURL = 'https://mysite.com/download-version.xpi';
        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        const fakeAddonManager = getFakeAddonManagerWrapper({
          // Simulate the add-on not being installed already.
          getAddon: Promise.reject(),
        });
        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          version: createInternalVersionWithLang({
            ...fakeVersion,
            file: {
              ...fakeFile,
              hash: versionHash,
              url: versionInstallURL,
            },
          }),
        });

        const button = screen.getByText('Add to Firefox');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        await waitFor(() => {
          expect(fakeAddonManager.install).toHaveBeenCalledWith(
            versionInstallURL,
            expect.any(Function),
            { hash: versionHash },
          );
        });
      });

      it('tracks the start of an addon install', async () => {
        const addon = fakeAddon;
        const fakeTracking = createFakeTrackingWithJest();
        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
          // Make the install fail so that we can be sure only
          // the 'start' event gets tracked.
          install: jest.fn().mockRejectedValue(new Error('install error')),
        });
        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          _tracking: fakeTracking,
        });
        const button = screen.getByText('Add to Firefox');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        await waitFor(() => {
          expect(fakeAddonManager.install).toHaveBeenCalled();
        });

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
        const addon = fakeAddon;
        const fakeTracking = createFakeTrackingWithJest();
        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
        });
        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          _tracking: fakeTracking,
        });
        const button = screen.getByText('Add to Firefox');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        await waitFor(() => {
          expect(fakeAddonManager.install).toHaveBeenCalled();
        });

        expect(fakeTracking.sendEvent).toHaveBeenCalledTimes(2);
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
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const fakeTracking = createFakeTrackingWithJest();
        _loadVersions({
          slug: fakeAddon.slug,
          versions: [fakeAddon.current_version],
        });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
          // Make the install fail so that we can be sure only
          // the 'start' event gets tracked.
          install: jest.fn().mockRejectedValue(new Error('install error')),
        });
        render({
          addon,
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          _tracking: fakeTracking,
        });
        const button = screen.getByText('Install Theme');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        await waitFor(() => {
          expect(fakeAddonManager.install).toHaveBeenCalled();
        });

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
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const fakeTracking = createFakeTrackingWithJest();
        _loadVersions({
          slug: fakeAddon.slug,
          versions: [fakeAddon.current_version],
        });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
        });
        render({
          addon,
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          _tracking: fakeTracking,
        });
        const button = screen.getByText('Install Theme');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        await waitFor(() => {
          expect(fakeAddonManager.install).toHaveBeenCalled();
        });

        expect(fakeTracking.sendEvent).toHaveBeenCalledTimes(2);
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
        const addon = fakeAddon;
        const dispatch = jest.spyOn(store, 'dispatch');
        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
        });
        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
        });
        const button = screen.getByText('Add to Firefox');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        expect(dispatch).toHaveBeenCalledWith({
          type: START_DOWNLOAD,
          payload: { guid: addon.guid },
        });
      });

      it('dispatches error when addonManager.install throws', async () => {
        const addon = fakeAddon;
        const dispatch = jest.spyOn(store, 'dispatch');
        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });
        const fakeAddonManager = getFakeAddonManagerWrapper({
          getAddon: Promise.reject(),
          install: jest.fn().mockRejectedValue(new Error('install error')),
        });
        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
        });
        const button = screen.getByText('Add to Firefox');

        await waitFor(() => expect(button).not.toHaveAttribute('disabled'));

        userEvent.click(button);

        await waitFor(() => {
          expect(fakeAddonManager.install).toHaveBeenCalled();
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallError({
            error: FATAL_INSTALL_ERROR,
            guid: addon.guid,
          }),
        );
      });
    });

    describe('uninstall', () => {
      it('calls addonManager.uninstall()', async () => {
        const addon = fakeAddon;
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager, _getClientCompatibility });

        await waitFor(() => {
          expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Remove'));

        await waitFor(() => {
          expect(fakeAddonManager.uninstall).toHaveBeenCalledWith(addon.guid);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({ guid: addon.guid, status: UNINSTALLING }),
        );
      });

      it('dispatches error when addonManager.uninstall throws', async () => {
        const addon = fakeAddon;
        const fakeAddonManager = getFakeAddonManagerWrapper({
          uninstall: jest
            .fn()
            .mockRejectedValue(new Error('Add-on Manager uninstall error')),
        });
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        const dispatch = jest.spyOn(store, 'dispatch');

        render({ _addonManager: fakeAddonManager, _getClientCompatibility });

        await waitFor(() => {
          expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Remove'));

        await waitFor(() => {
          expect(fakeAddonManager.uninstall).toHaveBeenCalledWith(addon.guid);
        });

        expect(dispatch).toHaveBeenCalledWith(
          setInstallState({ guid: addon.guid, status: UNINSTALLING }),
        );
        expect(dispatch).toHaveBeenCalledWith(
          setInstallError({ guid: addon.guid, error: FATAL_UNINSTALL_ERROR }),
        );
      });

      it('tracks an addon uninstall', async () => {
        const addon = fakeAddon;
        const fakeTracking = createFakeTrackingWithJest();
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

        render({
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          _tracking: fakeTracking,
        });

        await waitFor(() => {
          expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Remove'));

        await waitFor(() => {
          expect(fakeAddonManager.uninstall).toHaveBeenCalledWith(addon.guid);
        });

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
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: ADDON_TYPE_STATIC_THEME,
        });
        const fakeTracking = createFakeTrackingWithJest();
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({
          slug: fakeAddon.slug,
          versions: [fakeAddon.current_version],
        });

        render({
          addon,
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          _tracking: fakeTracking,
        });

        await waitFor(() => {
          expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Remove'));

        await waitFor(() => {
          expect(fakeAddonManager.uninstall).toHaveBeenCalledWith(addon.guid);
        });

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
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          type: INVALID_TYPE,
        });
        const fakeTracking = createFakeTrackingWithJest();
        const fakeAddonManager = getFakeAddonManagerWrapper();
        const _getClientCompatibility = jest.fn().mockReturnValue({
          compatible: true,
        });

        _loadVersions({
          slug: fakeAddon.slug,
          versions: [fakeAddon.current_version],
        });

        render({
          addon,
          _addonManager: fakeAddonManager,
          _getClientCompatibility,
          _tracking: fakeTracking,
        });

        await waitFor(() => {
          expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        userEvent.click(screen.getByText('Remove'));

        await waitFor(() => {
          expect(fakeAddonManager.uninstall).toHaveBeenCalledWith(addon.guid);
        });

        expect(fakeTracking.sendEvent).toHaveBeenCalledWith({
          action: TRACKING_TYPE_INVALID,
          category: getAddonEventCategory(INVALID_TYPE, UNINSTALL_ACTION),
          label: addon.guid,
        });
      });
    });
  });
});
