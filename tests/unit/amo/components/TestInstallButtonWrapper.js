import * as React from 'react';

import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import InstallButtonWrapper, {
  InstallButtonWrapperBase,
} from 'amo/components/InstallButtonWrapper';
import { setInstallState } from 'core/reducers/installations';
import AMInstallButton from 'core/components/AMInstallButton';
import { CLIENT_APP_FIREFOX, INSTALLED, UNKNOWN } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalVersion, loadVersions } from 'core/reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  dispatchClientMetadata,
  fakeAddon,
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
        addon={createInternalAddon(fakeAddon)}
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
      addon: createInternalAddon(addon),
      store,
    });

    sinon.assert.calledWith(_getClientCompatibility, {
      addon: createInternalAddon(addon),
      clientApp,
      currentVersion: createInternalVersion(addon.current_version),
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
      addon: createInternalAddon(addon),
      store,
      version: createInternalVersion(version),
    });

    sinon.assert.calledWith(_getClientCompatibility, {
      addon: createInternalAddon(addon),
      clientApp,
      currentVersion: createInternalVersion(version),
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
      addon: createInternalAddon(addon),
      store,
    });

    sinon.assert.neverCalledWith(_getClientCompatibility, {
      addon: createInternalAddon(addon),
      clientApp,
      currentVersion: createInternalVersion(addon.current_version),
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
    const addon = createInternalAddon(fakeAddon);

    const root = render({
      addon,
    });

    expect(root.find(AMInstallButton)).toHaveProp('addon', addon);
  });

  it('passes a null currentVersion to AMInstallButton when no version is loaded', () => {
    const addon = createInternalAddon(fakeAddon);

    const root = render({
      addon,
    });

    expect(root.find(AMInstallButton)).toHaveProp('currentVersion', null);
  });

  it('passes a currentVersion to AMInstallButton when one is loaded', () => {
    const addon = fakeAddon;

    _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

    const root = render({
      addon: createInternalAddon(addon),
    });

    expect(root.find(AMInstallButton)).toHaveProp(
      'currentVersion',
      createInternalVersion(addon.current_version),
    );
  });

  it('passes a currentVersion to AMInstallButton when one is specified', () => {
    const version = createInternalVersion({
      ...fakeVersion,
      id: fakeAddon.current_version.id + 1,
    });
    const root = render({
      addon: createInternalAddon(fakeAddon),
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
      addon: createInternalAddon(addon),
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
      addon: createInternalAddon(addon),
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
      addon: createInternalAddon(addon),
    });

    expect(root.find(AMInstallButton)).toHaveProp('canUninstall', canUninstall);
  });

  it('passes the expected status to AMInstallButton when the add-on is not installed', () => {
    const root = render();

    expect(root.find(AMInstallButton)).toHaveProp('status', UNKNOWN);
  });

  it('passes an add-on to GetFirefoxButton', () => {
    const addon = createInternalAddon(fakeAddon);

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
});
