import * as React from 'react';
import { encode } from 'universal-base64url';

import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import { setInstallState } from 'amo/reducers/installations';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  INSTALLED,
} from 'amo/constants';
import { loadVersions } from 'amo/reducers/versions';
import {
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeFile,
  fakeInstalledAddon,
  fakeVersion,
  render as defaultRender,
  screen,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
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
});
