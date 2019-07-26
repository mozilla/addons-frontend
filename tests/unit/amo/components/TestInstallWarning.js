import * as React from 'react';

import InstallWarning, {
  EXPERIMENT_CATEGORY_DISPLAY,
  EXPERIMENT_ID,
  INSTALL_WARNING_EXPERIMENT_DIMENSION,
  VARIANT_INCLUDE_WARNING,
  VARIANT_EXCLUDE_WARNING,
  InstallWarningBase,
} from 'amo/components/InstallWarning';
import { setInstallState } from 'core/actions/installations';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  INSTALLED,
  UNINSTALLED,
  UNKNOWN,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeTracking,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeInstalledAddon,
  getFakeLogger,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';
import Notice from 'ui/components/Notice';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox57,
    }).store;
  });

  const render = (props = {}) => {
    return shallowUntilTarget(
      <InstallWarning
        addon={createInternalAddon(fakeAddon)}
        experimentIsEnabled
        i18n={fakeI18n()}
        store={store}
        variant={VARIANT_INCLUDE_WARNING}
        {...props}
      />,
      InstallWarningBase,
    );
  };

  const _setInstallStatus = ({ addon, status }) => {
    store.dispatch(
      setInstallState({
        ...fakeInstalledAddon,
        guid: addon.guid,
        status,
      }),
    );
  };

  describe('couldShowWarning', () => {
    const addonThatWouldShowWarning = {
      ...fakeAddon,
      is_recommended: false,
      type: ADDON_TYPE_EXTENSION,
    };

    // This will render the component with values needed to allow
    // couldShowWarning to be true.
    const renderWithWarning = (props = {}) => {
      return render({
        _hasAddonManager: sinon.stub().returns(false),
        addon: createInternalAddon(addonThatWouldShowWarning),
        experimentIsEnabled: true,
        ...props,
      });
    };

    // This is a test for the happy path, but also serves as a sanity test for
    // renderWithWarning returning the happy path.
    it('returns true if the experiment is enabled, the userAgent is Firefox, and the add-on is an extension and is not recommended', () => {
      const component = renderWithWarning();

      expect(component.instance().couldShowWarning()).toEqual(true);
    });

    it.each([UNINSTALLED, UNKNOWN])(
      `returns true if mozAddonManager exists and the add-on has a status of %s`,
      (installStatus) => {
        const addon = addonThatWouldShowWarning;
        _setInstallStatus({ addon, status: installStatus });

        const component = renderWithWarning({
          _hasAddonManager: sinon.stub().returns(true),
          addon: createInternalAddon(addon),
        });

        expect(component.instance().couldShowWarning()).toEqual(true);
      },
    );

    it('returns true regardless of status if there is no mozAddonManager', () => {
      const component = renderWithWarning({
        _hasAddonManager: sinon.stub().returns(false),
      });

      expect(component.instance().couldShowWarning()).toEqual(true);
    });

    it('returns false if the add-on is not an extension', () => {
      const component = renderWithWarning({
        addon: createInternalAddon({
          ...addonThatWouldShowWarning,
          type: ADDON_TYPE_STATIC_THEME,
        }),
      });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the add-on is recommended', () => {
      const component = renderWithWarning({
        addon: createInternalAddon({
          ...addonThatWouldShowWarning,
          is_recommended: true,
        }),
      });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if mozAddonManager exists and the addon does not have a status of UNINSTALLED or UNKNOWN', () => {
      const addon = addonThatWouldShowWarning;
      _setInstallStatus({ addon, status: INSTALLED });

      const component = renderWithWarning({
        _hasAddonManager: sinon.stub().returns(true),
        addon: createInternalAddon(addon),
      });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the experiment is disabled', () => {
      const component = renderWithWarning({
        experimentIsEnabled: false,
      });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the userAgent is not Firefox', () => {
      dispatchClientMetadata({
        store,
        userAgent: userAgentsByPlatform.mac.chrome41,
      });

      const component = renderWithWarning({ store });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });
  });

  it('sets a dimension on mount if a variant exists', () => {
    const _tracking = createFakeTracking();
    const variant = VARIANT_INCLUDE_WARNING;

    render({ _tracking, variant });

    sinon.assert.calledWith(_tracking.setDimension, {
      dimension: INSTALL_WARNING_EXPERIMENT_DIMENSION,
      value: variant,
    });
  });

  it('does not set a dimension on mount if a variant does not exist', () => {
    const _log = getFakeLogger();
    const _tracking = createFakeTracking();

    render({ _log, _tracking, variant: undefined });

    sinon.assert.notCalled(_tracking.setDimension);
    sinon.assert.calledWith(
      _log.debug,
      `No variant set for experiment "${EXPERIMENT_ID}"`,
    );
  });

  it('calls couldShowWarning on mount', () => {
    const _couldShowWarning = sinon.spy();

    render({ _couldShowWarning });

    sinon.assert.called(_couldShowWarning);
  });

  it('calls couldShowWarning on update', () => {
    const _couldShowWarning = sinon.spy();

    const root = render({ _couldShowWarning });

    _couldShowWarning.resetHistory();

    root.setProps({ installStatus: INSTALLED });

    sinon.assert.called(_couldShowWarning);
  });

  describe('display tracking event', () => {
    const _tracking = createFakeTracking();

    beforeEach(() => {
      _tracking.sendEvent.resetHistory();
    });

    describe('VARIANT_INCLUDE_WARNING', () => {
      const variant = VARIANT_INCLUDE_WARNING;

      it('sends the event on mount if couldShowWarning is true and a variant exists', () => {
        const _couldShowWarning = sinon.stub().returns(true);
        const addon = createInternalAddon(fakeAddon);

        render({
          _couldShowWarning,
          _tracking,
          addon,
          variant,
        });

        sinon.assert.calledWith(_tracking.sendEvent, {
          action: variant,
          category: EXPERIMENT_CATEGORY_DISPLAY,
          label: addon.name,
        });
      });

      it('does not send the event on mount if couldShowWarning is false', () => {
        const _couldShowWarning = sinon.stub().returns(false);

        render({ _couldShowWarning, _tracking, variant });

        sinon.assert.notCalled(_tracking.sendEvent);
      });

      it('does not send the event on mount if a variant is not set', () => {
        const _couldShowWarning = sinon.stub().returns(true);

        render({ _couldShowWarning, _tracking, variant: undefined });

        sinon.assert.notCalled(_tracking.sendEvent);
      });

      it('sends the event on update if installStatus has changed', () => {
        const _couldShowWarning = sinon.stub().returns(true);
        const addon = createInternalAddon(fakeAddon);
        const installStatus = UNINSTALLED;

        const root = render({
          _couldShowWarning,
          _tracking,
          addon,
          installStatus: undefined,
          variant,
        });

        _tracking.sendEvent.resetHistory();

        root.setProps({ installStatus });

        sinon.assert.calledWith(_tracking.sendEvent, {
          action: variant,
          category: EXPERIMENT_CATEGORY_DISPLAY,
          label: addon.name,
        });
      });

      it('does not send the event on update if installStatus has not changed', () => {
        const _couldShowWarning = sinon.stub().returns(true);
        const installStatus = UNINSTALLED;
        const addon = fakeAddon;
        _setInstallStatus({ addon, status: installStatus });

        const root = render({
          _couldShowWarning,
          _tracking,
          variant,
        });

        _tracking.sendEvent.resetHistory();

        root.setProps({ installStatus });

        sinon.assert.notCalled(_tracking.sendEvent);
      });
    });
  });

  it('displays a warning if couldShowWarning is true and the user is in the included cohort', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(1);
  });

  it('does not display a warning if couldShowWarning is false', () => {
    const _couldShowWarning = sinon.stub().returns(false);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(0);
  });

  describe('VARIANT_EXCLUDE_WARNING', () => {
    it('does not display a warning if the user is in the excluded cohort', () => {
      const _couldShowWarning = sinon.stub().returns(true);

      const root = render({
        _couldShowWarning,
        variant: VARIANT_EXCLUDE_WARNING,
      });
      expect(root.find(Notice)).toHaveLength(0);
    });
  });
});
