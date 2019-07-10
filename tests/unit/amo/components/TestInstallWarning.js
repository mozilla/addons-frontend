import * as React from 'react';

import InstallWarning, {
  EXPERIMENT_CATEGORY_SHOW,
  EXPERIMENT_ID,
  INSTALL_WARNING_EXPERIMENT_DIMENSION,
  VARIANT_INCLUDE_WARNING,
  VARIANT_EXCLUDE_WARNING,
  couldShowWarning,
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
} from 'tests/unit/helpers';
import Notice from 'ui/components/Notice';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return shallowUntilTarget(
      <InstallWarning
        addon={createInternalAddon(fakeAddon)}
        experimentEnabled
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
    it.each([UNINSTALLED, UNKNOWN])(
      `returns true if the add-on is an extension, is not recommended, has a status of %s, and the experiment is enabled`,
      (installStatus) => {
        expect(
          couldShowWarning({
            addonIsExtension: true,
            addonIsRecommended: false,
            experimentEnabled: true,
            installStatus,
          }),
        ).toEqual(true);
      },
    );

    it('returns false if the add-on is not an extension', () => {
      expect(
        couldShowWarning({
          addonIsExtension: false,
          addonIsRecommended: true,
          experimentEnabled: true,
          installStatus: UNINSTALLED,
        }),
      ).toEqual(false);
    });

    it('returns false if the add-on is recommended', () => {
      expect(
        couldShowWarning({
          addonIsExtension: true,
          addonIsRecommended: true,
          experimentEnabled: true,
          installStatus: UNINSTALLED,
        }),
      ).toEqual(false);
    });

    it('returns false if the addon does not have a status of UNINSTALLED or UNKNOWN', () => {
      expect(
        couldShowWarning({
          addonIsExtension: true,
          addonIsRecommended: false,
          experimentEnabled: true,
          installStatus: INSTALLED,
        }),
      ).toEqual(false);
    });

    it('returns false if the experiment is disabled', () => {
      expect(
        couldShowWarning({
          addonIsExtension: true,
          addonIsRecommended: false,
          experimentEnabled: false,
          installStatus: UNINSTALLED,
        }),
      ).toEqual(false);
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

  it('passes installStatus to couldShowWarning on mount', () => {
    const _couldShowWarning = sinon.spy();
    const isRecommended = false;
    const experimentEnabled = true;
    const installStatus = UNINSTALLED;
    const addon = { ...fakeAddon, is_recommended: isRecommended };
    _setInstallStatus({ addon, status: installStatus });

    render({
      _couldShowWarning,
      addon: createInternalAddon(addon),
      experimentEnabled,
      variant: VARIANT_INCLUDE_WARNING,
    });

    sinon.assert.calledWith(_couldShowWarning, {
      addonIsExtension: true,
      addonIsRecommended: isRecommended,
      experimentEnabled,
      installStatus,
    });
  });

  it('passes installStatus to couldShowWarning on update', () => {
    const _couldShowWarning = sinon.spy();
    const isRecommended = false;
    const experimentEnabled = true;
    const installStatus = UNINSTALLED;
    const addon = { ...fakeAddon, is_recommended: isRecommended };

    const root = render({
      _couldShowWarning,
      addon: createInternalAddon(addon),
      experimentEnabled,
      variant: VARIANT_INCLUDE_WARNING,
    });

    sinon.assert.calledWith(_couldShowWarning, {
      addonIsExtension: true,
      addonIsRecommended: isRecommended,
      experimentEnabled,
      installStatus: undefined,
    });

    _couldShowWarning.resetHistory();

    root.setProps({ installStatus });

    sinon.assert.calledWith(_couldShowWarning, {
      addonIsExtension: true,
      addonIsRecommended: isRecommended,
      experimentEnabled,
      installStatus,
    });
  });

  describe('display tracking event', () => {
    const _tracking = createFakeTracking();
    const variant = VARIANT_INCLUDE_WARNING;

    beforeEach(() => {
      _tracking.sendEvent.resetHistory();
    });

    it('sends the event on mount if couldShowWarning is true and a variant exists', () => {
      const _couldShowWarning = sinon.stub().returns(true);
      const addon = fakeAddon;

      render({
        _couldShowWarning,
        _tracking,
        addon: createInternalAddon(addon),
        variant,
      });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: variant,
        category: EXPERIMENT_CATEGORY_SHOW,
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
      const addon = fakeAddon;
      const installStatus = UNINSTALLED;

      const root = render({
        _couldShowWarning,
        _tracking,
        addon: createInternalAddon(addon),
        installStatus: undefined,
        variant,
      });

      _tracking.sendEvent.resetHistory();

      root.setProps({ installStatus });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: variant,
        category: EXPERIMENT_CATEGORY_SHOW,
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

  it('displays a warning if couldShowWarning is true and the user is in the included cohort', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(1);
  });

  it.each([[true, ADDON_TYPE_EXTENSION], [false, ADDON_TYPE_STATIC_THEME]])(
    `passes addonIsExtension = %s to couldShowWarning on render for type: %s`,
    (expected, type) => {
      const _couldShowWarning = sinon.spy();
      const experimentEnabled = true;
      const isRecommended = true;
      const addon = {
        ...fakeAddon,
        is_recommended: isRecommended,
        type,
      };

      render({
        _couldShowWarning,
        addon: createInternalAddon(addon),
        experimentEnabled,
      });

      sinon.assert.calledWith(_couldShowWarning, {
        addonIsExtension: expected,
        addonIsRecommended: isRecommended,
        experimentEnabled,
        installStatus: undefined,
      });
    },
  );

  it('does not display a warning if couldShowWarning is false', () => {
    const _couldShowWarning = sinon.stub().returns(false);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(0);
  });

  it('does not display a warning if the user is in the excluded cohort', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_EXCLUDE_WARNING,
    });
    expect(root.find(Notice)).toHaveLength(0);
  });
});
