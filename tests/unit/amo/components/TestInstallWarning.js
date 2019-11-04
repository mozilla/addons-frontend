import * as React from 'react';
import UAParser from 'ua-parser-js';

import InstallWarning, {
  EXPERIMENT_CATEGORY_DISPLAY,
  EXPERIMENT_ID,
  INSTALL_WARNING_EXPERIMENT_DIMENSION,
  VARIANT_INCLUDE_WARNING_CURRENT,
  VARIANT_INCLUDE_WARNING_PROPOSED,
  VARIANT_EXCLUDE_WARNING,
  InstallWarningBase,
} from 'amo/components/InstallWarning';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { NOT_IN_EXPERIMENT } from 'core/withExperiment';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  createFakeTracking,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  getFakeLogger,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';
import Notice, { genericWarningType, warningType } from 'ui/components/Notice';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: userAgentsByPlatform.mac.firefox57,
    }).store;
  });

  const render = ({ location = createFakeLocation(), ...customProps } = {}) => {
    const props = {
      _correctedLocationForPlatform: sinon.stub().returns(null),
      addon: createInternalAddon(fakeAddon),
      i18n: fakeI18n(),
      isExperimentEnabled: true,
      isUserInExperiment: true,
      store,
      variant: VARIANT_INCLUDE_WARNING_CURRENT,
      ...customProps,
    };

    return shallowUntilTarget(
      <InstallWarning {...props} />,
      InstallWarningBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  it('can be customized with a class name', () => {
    const className = 'ExampleClass';
    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

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
        addon: createInternalAddon(addonThatWouldShowWarning),
        isExperimentEnabled: true,
        isUserInExperiment: true,
        ...props,
      });
    };

    // This is a test for the happy path, but also serves as a sanity test for
    // renderWithWarning returning the happy path.
    it('returns true if the experiment is enabled, the userAgent and clientApp are both Firefox, and the add-on is an extension and is not recommended', () => {
      const component = renderWithWarning();

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

    it('returns false if the experiment is disabled', () => {
      const component = renderWithWarning({
        isExperimentEnabled: false,
      });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the user is not in the experiment', () => {
      const component = renderWithWarning({
        isUserInExperiment: false,
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

    it('returns false if the clientApp is Android', () => {
      dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });

      const component = renderWithWarning({ store });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the WrongPlatformWarning would be shown', () => {
      const _correctedLocationForPlatform = sinon.stub().returns('/some/path/');

      const component = renderWithWarning({ _correctedLocationForPlatform });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('calls _correctedLocationForPlatform with clientApp, location and userAgentInfo', () => {
      const clientApp = CLIENT_APP_ANDROID;
      const userAgent = userAgentsByPlatform.mac.firefox57;
      const parsedUserAgent = UAParser(userAgent);
      const location = createFakeLocation();
      const _correctedLocationForPlatform = sinon.spy();

      dispatchClientMetadata({
        store,
        userAgent,
      });

      renderWithWarning({ _correctedLocationForPlatform, location, store });

      sinon.assert.calledWith(_correctedLocationForPlatform, {
        clientApp,
        location,
        userAgentInfo: sinon.match({
          browser: sinon.match(parsedUserAgent.browser),
          os: sinon.match(parsedUserAgent.os),
        }),
      });
    });
  });

  it('sets a dimension on mount if a variant exists', () => {
    const _tracking = createFakeTracking();
    const variant = VARIANT_INCLUDE_WARNING_CURRENT;

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

  it('does not set a dimension on mount if the user is not in the experiment', () => {
    const _log = getFakeLogger();
    const _tracking = createFakeTracking();
    const variant = NOT_IN_EXPERIMENT;

    render({ _log, _tracking, isUserInExperiment: false, variant });

    sinon.assert.notCalled(_tracking.setDimension);
    sinon.assert.calledWith(
      _log.debug,
      `User not enrolled in experiment "${EXPERIMENT_ID}"`,
    );
  });

  it('does not set a dimension on mount if clientApp is Android', () => {
    const _tracking = createFakeTracking();
    dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });

    render({ _tracking, store, variant: VARIANT_INCLUDE_WARNING_CURRENT });

    sinon.assert.notCalled(_tracking.setDimension);
  });

  it('calls couldShowWarning on mount', () => {
    const _couldShowWarning = sinon.spy();

    render({ _couldShowWarning });

    sinon.assert.called(_couldShowWarning);
  });

  describe('display tracking event', () => {
    const _tracking = createFakeTracking();

    beforeEach(() => {
      _tracking.sendEvent.resetHistory();
    });

    it('sends the event on mount if couldShowWarning is true and a variant exists', () => {
      const _couldShowWarning = sinon.stub().returns(true);
      const addon = createInternalAddon(fakeAddon);
      const variant = VARIANT_INCLUDE_WARNING_CURRENT;

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

      render({
        _couldShowWarning,
        _tracking,
        variant: VARIANT_INCLUDE_WARNING_CURRENT,
      });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send the event on mount if a variant is not set', () => {
      const _couldShowWarning = sinon.stub().returns(true);

      render({ _couldShowWarning, _tracking, variant: undefined });

      sinon.assert.notCalled(_tracking.sendEvent);
    });
  });

  it.each([VARIANT_INCLUDE_WARNING_CURRENT, VARIANT_INCLUDE_WARNING_PROPOSED])(
    'displays a warning if couldShowWarning is true and the user is in the %s branch',
    (variant) => {
      const _couldShowWarning = sinon.stub().returns(true);

      const root = render({
        _couldShowWarning,
        variant,
      });
      expect(root.find(Notice)).toHaveLength(1);
    },
  );

  it('does not display a warning if couldShowWarning is false', () => {
    const _couldShowWarning = sinon.stub().returns(false);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING_CURRENT,
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

  it('sets the expected notice type and message for VARIANT_INCLUDE_WARNING_CURRENT', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING_CURRENT,
    });
    expect(root.find(Notice)).toHaveProp('type', warningType);
    expect(root.find(Notice)).toHaveProp(
      'children',
      `This extension isn’t monitored by Mozilla. Make sure you trust the extension before you install it.`,
    );
  });

  it('sets the expected notice type and message for VARIANT_INCLUDE_WARNING_PROPOSED', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({
      _couldShowWarning,
      variant: VARIANT_INCLUDE_WARNING_PROPOSED,
    });
    expect(root.find(Notice)).toHaveProp('type', genericWarningType);
    expect(root.find(Notice)).toHaveProp(
      'children',
      `This is not a Recommended Extension. Make sure you trust it before installing.`,
    );
  });
});
