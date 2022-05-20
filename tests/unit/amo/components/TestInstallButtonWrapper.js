import * as React from 'react';
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
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  INSTALLED,
  LINE,
  RECOMMENDED,
  SPONSORED,
  SPOTLIGHT,
  STRATEGIC,
  VERIFIED,
} from 'amo/constants';
import { setInstallState } from 'amo/reducers/installations';
import { loadVersions } from 'amo/reducers/versions';
import tracking from 'amo/tracking';
import * as amoUtilsAddons from 'amo/utils/addons';
import {
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeFile,
  fakeInstalledAddon,
  fakeTheme,
  fakeVersion,
  render as defaultRender,
  screen,
  userAgents,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

jest.mock('amo/tracking', () => ({
  sendEvent: jest.fn(),
}));

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = (props = {}) => {
    return defaultRender(
      <InstallButtonWrapper
        addon={createInternalAddonWithLang(fakeAddon)}
        {...props}
      />,
      { store },
    );
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
        screen.getByRole('link', { name: 'Download Firefox' }),
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

      _dispatchClientMetadata({
        clientApp,
      });

      render({
        _getClientCompatibility,
        addon: createInternalAddonWithLang(addon),
        version: createInternalVersionWithLang(version),
      });

      expect(
        screen.getByRole('link', { name: 'Add to Firefox' }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Download Firefox')).not.toBeInTheDocument();
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
      screen.getByRole('link', { name: 'Download Firefox' });

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
          screen.queryByRole('link', { name: 'Download Firefox' }),
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

        expect(getFirefoxButton()).toBeInTheDocument();
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

      it('calls _getPromotedCategory to determine if an add-on is recommended', () => {
        const getPromotedCategorySpy = jest.spyOn(
          amoUtilsAddons,
          'getPromotedCategory',
        );

        const addon = createInternalAddonWithLang(fakeAddon);
        render({ addon });

        expect(getPromotedCategorySpy).toHaveBeenCalledWith({
          addon,
          clientApp,
          forBadging: true,
        });
      });

      it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
        'has the expected button text for an RTAMO supported extension',
        (category) => {
          render({
            addon: createInternalAddonWithLang({
              ...fakeAddon,
              promoted: { category, apps: [CLIENT_APP_FIREFOX] },
            }),
          });

          expect(
            screen.getByRole('link', {
              name: 'Download Firefox and get the extension',
            }),
          ).toBeInTheDocument();
        },
      );

      it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
        'has the expected button text for an RTAMO supported extension, which is incompatible',
        (category) => {
          renderAsIncompatible({
            addon: createInternalAddonWithLang({
              ...fakeAddon,
              promoted: { category, apps: [CLIENT_APP_FIREFOX] },
            }),
          });

          expect(
            screen.getByRole('link', {
              name: 'Download the new Firefox and get the extension',
            }),
          ).toBeInTheDocument();
        },
      );

      it.each([SPOTLIGHT, STRATEGIC])(
        'has the expected button text for an RTAMO unsupported extension',
        (category) => {
          render({
            addon: createInternalAddonWithLang({
              ...fakeAddon,
              promoted: { category, apps: [CLIENT_APP_FIREFOX] },
            }),
          });

          expect(
            screen.getByRole('link', {
              name: 'Download Firefox',
            }),
          ).toBeInTheDocument();
        },
      );

      it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
        'has the expected button text for an RTAMO supported theme',
        (category) => {
          render({
            addon: createInternalAddonWithLang({
              ...fakeTheme,
              promoted: { category, apps: [CLIENT_APP_FIREFOX] },
            }),
          });

          expect(
            screen.getByRole('link', {
              name: 'Download Firefox and get the theme',
            }),
          ).toBeInTheDocument();
        },
      );

      it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
        'has the expected button text for an RTAMO supported theme, which is incompatible',
        (category) => {
          renderAsIncompatible({
            addon: createInternalAddonWithLang({
              ...fakeTheme,
              promoted: { category, apps: [CLIENT_APP_FIREFOX] },
            }),
          });

          expect(
            screen.getByRole('link', {
              name: 'Download the new Firefox and get the theme',
            }),
          ).toBeInTheDocument();
        },
      );

      it.each([SPOTLIGHT, STRATEGIC])(
        'has the expected button text for an RTAMO supported theme',
        (category) => {
          render({
            addon: createInternalAddonWithLang({
              ...fakeTheme,
              promoted: { category, apps: [CLIENT_APP_FIREFOX] },
            }),
          });

          expect(
            screen.getByRole('link', {
              name: 'Download Firefox',
            }),
          ).toBeInTheDocument();
        },
      );

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
});
