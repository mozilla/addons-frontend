import * as React from 'react';

import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import InstallButtonWrapper, {
  InstallButtonWrapperBase,
} from 'amo/components/InstallButtonWrapper';
import { setInstallState } from 'core/actions/installations';
import AMInstallButton from 'core/components/AMInstallButton';
import { CLIENT_APP_FIREFOX, INSTALLED, UNKNOWN } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalVersion, loadVersions } from 'core/reducers/versions';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeInstalledAddon,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render(props = {}) {
    return shallowUntilTarget(
      <InstallButtonWrapper
        addon={createInternalAddon(fakeAddon)}
        store={store}
        {...props}
      />,
      InstallButtonWrapperBase,
    );
  }

  const _loadVersions = ({ addon = fakeAddon } = {}) => {
    store.dispatch(
      loadVersions({
        slug: addon.slug,
        versions: [
          {
            ...addon.current_version,
          },
        ],
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

  it('calls getClientCompatibility to determine the compatibility', () => {
    const addon = fakeAddon;

    _loadVersions({ addon });

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

  it('passes an addon to AMInstallButton', () => {
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

    _loadVersions({ addon });

    const root = render({
      addon: createInternalAddon(addon),
    });

    expect(root.find(AMInstallButton)).toHaveProp(
      'currentVersion',
      createInternalVersion(addon.current_version),
    );
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

  it('passes the expected status to AMInstallButton when the add-on is not installed', () => {
    const root = render();

    expect(root.find(AMInstallButton)).toHaveProp('status', UNKNOWN);
  });

  it('passes an addon to GetFirefoxButton', () => {
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
});
