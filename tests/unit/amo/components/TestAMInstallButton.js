import * as React from 'react';
import { TransitionGroup } from 'react-transition-group';

import AMInstallButton, {
  AMInstallButtonBase,
} from 'amo/components/AMInstallButton';
import {
  ADDON_TYPE_STATIC_THEME,
  DISABLED,
  DISABLING,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  INACTIVE,
  INSTALLED,
  INSTALLING,
  OS_ALL,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'amo/constants';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  fakeAddon,
  fakeCookies,
  fakeI18n,
  fakeTheme,
  fakeVersion,
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Button from 'amo/components/Button';

// Skip `withCookies` HOC since Enzyme does not support the React Context API.
// See: https://github.com/mozilla/addons-frontend/issues/6839
jest.mock('react-cookie', () => ({
  withCookies: (component) => component,
}));

describe(__filename, () => {
  const createFakeEventWithURL = ({ url }) => {
    return createFakeEvent({
      currentTarget: {
        href: url,
      },
    });
  };

  const createInternalVersionWithInstallURL = ({
    installURL = 'https://a.m.o/files/addon.xpi',
  }) => {
    return createInternalVersionWithLang({
      ...fakeVersion,
      file: {
        ...fakeVersion.file,
        platform: OS_ALL,
        url: installURL,
      },
    });
  };

  const renderProps = (customProps = {}) => ({
    addon: createInternalAddonWithLang(fakeAddon),
    cookies: fakeCookies(),
    currentVersion: createInternalVersionWithLang(fakeVersion),
    disabled: false,
    enable: sinon.stub(),
    hasAddonManager: true,
    i18n: fakeI18n(),
    install: sinon.stub(),
    isAddonEnabled: sinon.stub(),
    location: createFakeLocation(),
    status: UNINSTALLED,
    uninstall: sinon.stub(),
    ...customProps,
  });

  const render = (props) => {
    const { location, ...otherProps } = renderProps(props);

    return shallowUntilTarget(
      <AMInstallButton {...otherProps} />,
      AMInstallButtonBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  it('renders a Button for extensions', () => {
    const installURL = 'https://a.m.o/files/addon.xpi';

    const root = render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
    });

    expect(root.type()).toEqual(TransitionGroup);
    expect(root.find(TransitionGroup).prop('component')).toEqual('div');
    expect(root).toHaveClassName('AMInstallButton');

    const button = root.find(Button);

    expect(button).toHaveLength(1);
    expect(button.children()).toHaveText('Add to Firefox');
    expect(button).toHaveClassName('AMInstallButton-button');
    expect(button).not.toHaveClassName('AMInstallButton-button--uninstall');
    expect(button).toHaveProp('buttonType', 'action');
    expect(button).toHaveProp('className', 'AMInstallButton-button');
    expect(button).toHaveProp('disabled', false);
    expect(button).not.toHaveProp('data-browsertheme');
    expect(button).toHaveProp('href', installURL);
    expect(button).toHaveProp('onClick', root.instance().installExtension);
  });

  it('renders Install Theme text on button when it is a static theme', () => {
    const addon = createInternalAddonWithLang({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });

    expect(root.find(Button).children()).toHaveText('Install Theme');
  });

  it('disables the button when disabled prop is true', () => {
    const installURL = 'https://addons.mozilla.org/download';
    const root = render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
      disabled: true,
    });

    const button = root.find('.AMInstallButton-button');

    expect(button).toHaveProp('disabled', true);
    expect(button).toHaveProp('href', installURL);

    const onClick = button.prop('onClick');

    expect(typeof onClick).toEqual('function');
    const event = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub(),
    };

    // A return value of false will prevent the anchor tag from firing.
    expect(onClick(event)).toBe(false);
    sinon.assert.called(event.preventDefault);
    sinon.assert.called(event.stopPropagation);
  });

  it('disables the button when status is UNKNOWN', () => {
    const root = render({ status: UNKNOWN });

    expect(root.find(Button)).toHaveProp('disabled', true);
  });

  it('disables the button when currentVersion is null', () => {
    const root = render({ currentVersion: null });

    expect(root.find(Button)).toHaveProp('disabled', true);
    expect(root.find(Button)).toHaveProp('href', undefined);
  });

  it('calls the `install` helper to install an extension', async () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({ addon, enable, install });

    const event = createFakeEvent();
    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledOnce(install);
    sinon.assert.notCalled(enable);
    sinon.assert.calledOnce(event.preventDefault);
    sinon.assert.calledOnce(event.stopPropagation);
  });

  it('calls the `install` and `enable` helpers to install a static theme', async () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({
      addon,
      enable,
      install,
      isAddonEnabled: sinon.stub().resolves(false),
    });

    const event = createFakeEvent();

    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledOnce(install);

    sinon.assert.calledWith(enable, { sendTrackingEvent: false });
    sinon.assert.calledOnce(enable);

    sinon.assert.calledOnce(event.preventDefault);
    sinon.assert.calledOnce(event.stopPropagation);
  });

  it("does not call the `enable` helper after the `install` helper for a static theme if it's already enabled", async () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const enable = sinon.spy();
    const install = sinon.spy();

    const root = render({
      addon,
      enable,
      install,
      isAddonEnabled: sinon.stub().resolves(true),
    });

    const event = createFakeEvent();

    const installButton = root.find('.AMInstallButton-button');

    const onClick = installButton.prop('onClick');
    await onClick(event);

    sinon.assert.calledOnce(install);
    sinon.assert.notCalled(enable);
  });

  it.each([ENABLED, INSTALLED])(
    'renders a "remove" button when add-on is %s',
    (status) => {
      const root = render({ status });

      const button = root.find(Button);
      expect(button).toHaveLength(1);
      expect(button).toHaveProp('buttonType', 'neutral');
      expect(button).toHaveProp('onClick', root.instance().uninstallAddon);
      expect(button).toHaveProp('disabled', false);
      expect(button).toHaveClassName('AMInstallButton-button');
      expect(button).toHaveClassName('AMInstallButton-button--uninstall');

      expect(root.find('.AMInstallButton-loading-button')).toHaveLength(0);
    },
  );

  it.each([ENABLED, INSTALLED])(
    'allows to uninstall an add-on when canUninstall is undefined and add-on is %s',
    (status) => {
      const root = render({ status, canUninstall: undefined });

      const button = root.find(Button);
      expect(button).toHaveLength(1);
      expect(button).toHaveProp('onClick', root.instance().uninstallAddon);
      expect(button).toHaveProp('disabled', false);
    },
  );

  it.each([ENABLED, INSTALLED])(
    'allows to uninstall an add-on when canUninstall is true and add-on is %s',
    (status) => {
      const root = render({ status, canUninstall: true });

      const button = root.find(Button);
      expect(button).toHaveLength(1);
      expect(button).toHaveProp('onClick', root.instance().uninstallAddon);
      expect(button).toHaveProp('disabled', false);
    },
  );

  it.each([ENABLED, INSTALLED])(
    'does not allow to uninstall an add-on when canUninstall is false and add-on is %s',
    (status) => {
      const root = render({ status, canUninstall: false });

      const button = root.find(Button);
      expect(button).toHaveLength(1);
      expect(button).not.toHaveProp('onClick', root.instance().uninstallAddon);
      expect(button).toHaveProp('disabled', true);
    },
  );

  it('renders an "enable" button when add-on is DISABLED', () => {
    const root = render({ status: DISABLED });

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button).toHaveProp('buttonType', 'neutral');
    expect(button).toHaveProp('onClick', root.instance().enableAddon);
    expect(button).toHaveClassName('AMInstallButton-button');
    expect(button).toHaveClassName('AMInstallButton-button--enable');

    expect(root.find('.AMInstallButton-loading-button')).toHaveLength(0);
  });

  it('renders a "Add to Firefox" button when add-on is INACTIVE', () => {
    const root = render({ status: INACTIVE });

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button.children()).toHaveText('Add to Firefox');
  });

  it("renders custom button text when it's passed in", () => {
    const defaultButtonText = 'Install here';

    const root = render({ defaultButtonText });

    const button = root.find(Button);
    expect(button).toHaveLength(1);
    expect(button.children()).toHaveText(defaultButtonText);
  });

  it.each([DOWNLOADING, DISABLING, ENABLING, INSTALLING, UNINSTALLING])(
    'renders a loading Icon when add-on is %s',
    (status) => {
      const root = render({ status });

      expect(root).toHaveClassName('AMInstallButton');
      expect(root.find('.AMInstallButton-button')).toHaveLength(0);

      expect(root.find('.AMInstallButton-loading-button')).toHaveLength(1);
      expect(root.find('.AMInstallButton-loader-container')).toHaveLength(1);
      expect(root.find('.visually-hidden')).toHaveLength(1);
    },
  );

  it('renders an Icon when add-on is a static theme and status is INSTALLED', () => {
    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeTheme,
        type: ADDON_TYPE_STATIC_THEME,
      }),
      status: INSTALLED,
    });

    expect(root).toHaveClassName('AMInstallButton');
    expect(root.find('.AMInstallButton-button')).toHaveLength(0);

    expect(root.find('.AMInstallButton-loading-button')).toHaveLength(1);
    expect(root.find('.AMInstallButton-loader-container')).toHaveLength(1);
    expect(root.find('.visually-hidden')).toHaveLength(1);
  });

  it('sets an `alt` prop to the Icon when status is DOWNLOADING', () => {
    const root = render({ status: DOWNLOADING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Downloading',
    );
  });

  it('sets an `alt` prop to the Icon when status is ENABLING', () => {
    const root = render({ status: ENABLING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Enabling',
    );
  });

  it('sets an `alt` prop to the Icon when status is INSTALLING', () => {
    const root = render({ status: INSTALLING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Installing',
    );
  });

  it('sets an `alt` prop to the Icon when status is UNINSTALLING', () => {
    const root = render({ status: UNINSTALLING });

    expect(root.find('.AMInstallButton-loading-button')).toHaveProp(
      'title',
      'Uninstalling',
    );
  });

  it('calls the `uninstall` helper when uninstalling an add-on', () => {
    const installURL = 'http://example.org/install/url';
    const addon = createInternalAddonWithLang(fakeAddon);
    const uninstall = sinon.spy();

    const root = render({
      addon,
      uninstall,
      status: INSTALLED,
    });
    sinon.assert.notCalled(uninstall);

    const clickEvent = createFakeEventWithURL({ url: installURL });

    root.find(Button).simulate('click', clickEvent);

    sinon.assert.calledWith(uninstall, {
      guid: addon.guid,
      name: addon.name,
      type: addon.type,
    });
    sinon.assert.calledOnce(uninstall);

    sinon.assert.calledOnce(clickEvent.preventDefault);
    sinon.assert.calledOnce(clickEvent.stopPropagation);
  });

  it('calls the `enable` helper when enabling an add-on', () => {
    const enable = sinon.spy();

    const root = render({ enable, status: DISABLED });
    sinon.assert.notCalled(enable);

    const clickEvent = createFakeEvent();
    root.find(Button).simulate('click', clickEvent);

    // `enable` should be called with NO arguments.
    sinon.assert.calledWithExactly(enable);
    sinon.assert.calledOnce(enable);

    sinon.assert.calledOnce(clickEvent.preventDefault);
    sinon.assert.calledOnce(clickEvent.stopPropagation);
  });

  it('accepts an extra CSS class name', () => {
    const className = 'foo-bar';
    const root = render({ className });

    expect(root).toHaveClassName('AMInstallButton');
    expect(root).toHaveClassName(className);
  });
});
