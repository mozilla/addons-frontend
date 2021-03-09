import * as React from 'react';

import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import InstallButtonWrapper, {
  InstallButtonWrapperBase,
} from 'amo/components/InstallButtonWrapper';
import { setInstallState } from 'amo/reducers/installations';
import AMInstallButton from 'amo/components/AMInstallButton';
import { CLIENT_APP_FIREFOX, INSTALLED, UNKNOWN } from 'amo/constants';
import { loadVersions } from 'amo/reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeInstalledAddon,
  fakeVersion,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return shallowUntilTarget(
      <InstallButtonWrapper
        addon={createInternalAddonWithLang(fakeAddon)}
        i18n={fakeI18n()}
        location={createFakeLocation()}
        store={store}
        {...props}
      />,
      InstallButtonWrapperBase,
      {
        shallowOptions: createContextWithFakeRouter(),
      },
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
    const _getClientCompatibility = sinon.mock().returns({
      compatible: true,
    });

    _dispatchClientMetadata({
      clientApp,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
      store,
    });

    sinon.assert.calledWith(_getClientCompatibility, {
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
    const _getClientCompatibility = sinon.mock().returns({
      compatible: true,
    });

    _dispatchClientMetadata({
      clientApp,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
      store,
      version: createInternalVersionWithLang(version),
    });

    sinon.assert.calledWith(_getClientCompatibility, {
      addon: createInternalAddonWithLang(addon),
      clientApp,
      currentVersion: createInternalVersionWithLang(version),
      userAgentInfo: store.getState().api.userAgentInfo,
    });
  });

  it('does not call getClientCompatibility when the browser is not Firefox', () => {
    const addon = fakeAddon;

    const clientApp = CLIENT_APP_FIREFOX;
    const _getClientCompatibility = sinon.spy();

    _dispatchClientMetadata({
      clientApp,
      userAgent: userAgentsByPlatform.mac.chrome41,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
      store,
    });

    sinon.assert.neverCalledWith(_getClientCompatibility, {
      addon: createInternalAddonWithLang(addon),
      clientApp,
      currentVersion: createInternalVersionWithLang(addon.current_version),
      userAgentInfo: store.getState().api.userAgentInfo,
    });
  });

  it('disables the AMInstallButton when the browser is not Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });

    const root = render({
      store,
    });

    expect(root.find(AMInstallButton)).toHaveProp('disabled', true);
  });

  it('adds the InstallButtonWrapper--notFirefox class when the browser is not Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });

    const root = render({
      store,
    });

    expect(root).toHaveClassName('InstallButtonWrapper--notFirefox');
  });

  it('passes an add-on to AMInstallButton', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = render({
      addon,
    });

    expect(root.find(AMInstallButton)).toHaveProp('addon', addon);
  });

  it('passes a null currentVersion to AMInstallButton when no version is loaded', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = render({
      addon,
    });

    expect(root.find(AMInstallButton)).toHaveProp('currentVersion', null);
  });

  it('passes a currentVersion to AMInstallButton when one is loaded', () => {
    const addon = fakeAddon;

    _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

    const root = render({
      addon: createInternalAddonWithLang(addon),
    });

    expect(root.find(AMInstallButton)).toHaveProp(
      'currentVersion',
      createInternalVersionWithLang(addon.current_version),
    );
  });

  it('passes a currentVersion to AMInstallButton when one is specified', () => {
    const version = createInternalVersionWithLang({
      ...fakeVersion,
      id: fakeAddon.current_version.id + 1,
    });
    const root = render({
      addon: createInternalAddonWithLang(fakeAddon),
      version,
    });

    expect(root.find(AMInstallButton)).toHaveProp('currentVersion', version);
  });

  it('passes disabled to AMInstallButton based on what is returned from _getClientCompatibility', () => {
    const addon = fakeAddon;

    const _getClientCompatibility = sinon.stub().returns({
      compatible: true,
    });

    const root = render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
    });

    expect(root.find(AMInstallButton)).toHaveProp('disabled', false);
  });

  it('passes the expected status to AMInstallButton when the add-on is installed', () => {
    const addon = fakeAddon;

    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        status: INSTALLED,
      }),
    );

    const root = render({
      addon: createInternalAddonWithLang(addon),
    });

    expect(root.find(AMInstallButton)).toHaveProp('status', INSTALLED);
  });

  it('passes the canUninstall prop from the installation state to AMInstallButton', () => {
    const addon = fakeAddon;
    const canUninstall = true;

    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        canUninstall,
      }),
    );

    const root = render({
      addon: createInternalAddonWithLang(addon),
    });

    expect(root.find(AMInstallButton)).toHaveProp('canUninstall', canUninstall);
  });

  it('passes the expected status to AMInstallButton when the add-on is not installed', () => {
    const root = render();

    expect(root.find(AMInstallButton)).toHaveProp('status', UNKNOWN);
  });

  it('passes an add-on to GetFirefoxButton', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = render({
      addon,
    });

    expect(root.find(GetFirefoxButton)).toHaveProp('addon', addon);
  });

  it('passes the buttonType to GetFirefoxButton', () => {
    const buttonType = GET_FIREFOX_BUTTON_TYPE_ADDON;
    const root = render({
      getFirefoxButtonType: buttonType,
    });

    expect(root.find(GetFirefoxButton)).toHaveProp('buttonType', buttonType);
  });

  it('passes a custom className to AMInstallButton and GetFirefoxButton', () => {
    const className = 'some-class';
    const root = render({
      className,
    });

    expect(root.find(AMInstallButton)).toHaveClassName(
      `AMInstallButton--${className}`,
    );
    expect(root.find(GetFirefoxButton)).toHaveClassName(
      `GetFirefoxButton--${className}`,
    );
  });

  it('displays a download link when the browser is not compatible', () => {
    const _findInstallURL = sinon
      .stub()
      .returns('https://a.m.o/files/addon.xpi');
    const _getClientCompatibility = sinon.stub().returns({
      compatible: false,
    });

    const root = render({
      _findInstallURL,
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(root.find('.InstallButtonWrapper-download')).toHaveLength(1);
  });

  it('does not display a download link when the browser is compatible and showLinkInsteadOfButton is false', () => {
    const _findInstallURL = sinon
      .stub()
      .returns('https://a.m.o/files/addon.xpi');
    const _getClientCompatibility = sinon.stub().returns({
      compatible: true,
    });
    const showLinkInsteadOfButton = false;

    const root = render({
      _findInstallURL,
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
      showLinkInsteadOfButton,
    });

    expect(root.find('.InstallButtonWrapper-download')).toHaveLength(0);
  });

  it('displays a download link when the browser is compatible and showLinkInsteadOfButton is true', () => {
    const _findInstallURL = sinon
      .stub()
      .returns('https://a.m.o/files/addon.xpi');
    const _getClientCompatibility = sinon.stub().returns({
      compatible: true,
    });
    const showLinkInsteadOfButton = true;

    const root = render({
      _findInstallURL,
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
      showLinkInsteadOfButton,
    });

    expect(root.find('.InstallButtonWrapper-download')).toHaveLength(1);
  });

  it('adds a special classname when no download link is displayed', () => {
    const _getClientCompatibility = sinon.stub().returns({
      compatible: true,
    });

    const root = render({
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(root.find(AMInstallButton)).toHaveClassName(
      'AMInstallButton--noDownloadLink',
    );
  });

  it('does not add a special classname when a download link is displayed', () => {
    const _findInstallURL = sinon
      .stub()
      .returns('https://a.m.o/files/addon.xpi');
    const _getClientCompatibility = sinon.stub().returns({
      compatible: false,
    });

    const root = render({
      _findInstallURL,
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(root.find(AMInstallButton)).not.toHaveClassName(
      'AMInstallButton--noDownloadLink',
    );
  });

  it('calls findInstallURL to determine the installURL for the add-on', () => {
    const _findInstallURL = sinon.spy();
    const version = createInternalVersionWithLang(fakeAddon.current_version);

    render({ _findInstallURL, version });

    sinon.assert.calledWith(_findInstallURL, {
      file: version.file,
    });
  });

  it('does not call findInstallURL if there is no currentVersion', () => {
    const _findInstallURL = sinon.spy();

    render({ _findInstallURL, version: null });

    sinon.assert.notCalled(_findInstallURL);
  });

  it('uses the installURL in the download link', () => {
    const installURL = 'https://a.m.o/files/addon.xpi';
    const _findInstallURL = sinon.stub().returns(installURL);
    const _getClientCompatibility = sinon.stub().returns({
      compatible: false,
    });

    const root = render({
      _findInstallURL,
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(root.find('.InstallButtonWrapper-download-link')).toHaveProp(
      'href',
      installURL,
    );
  });

  it('does not display a download link when there is no installURL', () => {
    const _findInstallURL = sinon.stub().returns(null);
    const _getClientCompatibility = sinon.stub().returns({
      compatible: false,
    });

    const root = render({
      _findInstallURL,
      _getClientCompatibility,
      version: createInternalVersionWithLang(fakeAddon.current_version),
    });

    expect(root.find('.InstallButtonWrapper-download')).toHaveLength(0);
  });
});
