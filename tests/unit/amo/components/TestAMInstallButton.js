import * as React from 'react';
import { createEvent, fireEvent } from '@testing-library/react';

import AMInstallButton from 'amo/components/AMInstallButton';
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
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  fakeAddon,
  fakeTheme,
  fakeVersion,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const renderProps = (customProps = {}) => ({
    addon: createInternalAddonWithLang(fakeAddon),
    currentVersion: createInternalVersionWithLang(fakeVersion),
    disabled: false,
    enable: jest.fn(),
    hasAddonManager: true,
    install: jest.fn(),
    status: UNINSTALLED,
    uninstall: jest.fn(),
    ...customProps,
  });

  const render = (props = {}) => {
    return defaultRender(<AMInstallButton {...renderProps(props)} />);
  };

  const createInternalVersionWithInstallURL = ({
    installURL = 'https://addons.mozilla.org/files/addon.xpi',
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

  const getButton = (buttonText = 'Add to Firefox') =>
    screen.getByRole('button', { name: buttonText });
  const getLink = (buttonText = 'Add to Firefox') =>
    screen.getByRole('link', { name: buttonText });

  it('renders a Button for extensions', () => {
    const installURL = 'https://addons.mozilla.org/files/addon.xpi';

    render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
    });

    const button = getLink();

    expect(button).toHaveClass('AMInstallButton-button');
    expect(button).not.toHaveClass('AMInstallButton-button--uninstall');
    expect(button).toHaveClass('Button--action');
    expect(button).not.toHaveAttribute('disabled');
    expect(button).not.toHaveClass('disabled');
    expect(button).not.toHaveClass('Button--disabled');
    expect(button).toHaveAttribute('href', installURL);
  });

  it('renders Install Theme text on button when it is a static theme', () => {
    const addon = createInternalAddonWithLang({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
    });
    render({ addon });

    expect(getLink('Install Theme')).toBeInTheDocument();
  });

  it('disables the button when disabled prop is true', () => {
    const installURL = 'https://addons.mozilla.org/download';
    render({
      currentVersion: createInternalVersionWithInstallURL({ installURL }),
      disabled: true,
    });

    const button = getLink();

    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveClass('disabled');
    expect(button).toHaveClass('Button--disabled');
    expect(button).toHaveAttribute('href', installURL);
  });

  it('disables the button when status is UNKNOWN', () => {
    render({ status: UNKNOWN });

    expect(getLink()).toHaveAttribute('disabled');
  });

  it('disables the button when currentVersion is null', () => {
    render({ currentVersion: null });

    const button = getButton();
    expect(button).toHaveAttribute('disabled');
    expect(button).not.toHaveAttribute('href');
  });

  it('calls the `install` helper to install an extension', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const enable = jest.fn();
    const install = jest.fn();

    render({ addon, enable, install });

    const button = getLink();

    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

    fireEvent(button, clickEvent);

    expect(install).toHaveBeenCalledTimes(1);
    expect(enable).not.toHaveBeenCalled();
    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(stopPropagationWatcher).toHaveBeenCalled();
  });

  it('calls the `install` helper to install a static theme', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const enable = jest.fn();
    const install = jest.fn();

    render({
      addon,
      enable,
      install,
    });

    const button = getLink('Install Theme');

    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

    fireEvent(button, clickEvent);

    expect(install).toHaveBeenCalledTimes(1);
    expect(enable).not.toHaveBeenCalled();
    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(stopPropagationWatcher).toHaveBeenCalled();
  });

  it.each([ENABLED, INSTALLED])(
    'renders a "remove" button when add-on is %s',
    (status) => {
      render({ status });

      const button = getLink('Remove');
      expect(button).toHaveClass('Button--neutral');
      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveClass('AMInstallButton-button');
      expect(button).toHaveClass('AMInstallButton-button--uninstall');
    },
  );

  it.each([ENABLED, INSTALLED])(
    'allows to uninstall an add-on when canUninstall is undefined and add-on is %s',
    (status) => {
      render({ status, canUninstall: undefined });

      const button = getLink('Remove');
      expect(button).toHaveClass('AMInstallButton-button--uninstall');
      expect(button).not.toHaveAttribute('disabled');
    },
  );

  it.each([ENABLED, INSTALLED])(
    'allows to uninstall an add-on when canUninstall is true and add-on is %s',
    (status) => {
      render({ status, canUninstall: true });

      const button = getLink('Remove');
      expect(button).toHaveClass('AMInstallButton-button--uninstall');
      expect(button).not.toHaveAttribute('disabled');
    },
  );

  it.each([ENABLED, INSTALLED])(
    'does not allow to uninstall an add-on when canUninstall is false and add-on is %s',
    (status) => {
      render({ status, canUninstall: false });

      const button = getLink('Remove');
      expect(button).toHaveClass('AMInstallButton-button--uninstall');
      expect(button).toHaveAttribute('disabled');
    },
  );

  it('renders an "enable" button when add-on is DISABLED', () => {
    render({ status: DISABLED });

    const button = getLink('Enable');
    expect(button).toHaveClass('Button--neutral');
    expect(button).not.toHaveAttribute('disabled');
    expect(button).toHaveClass('AMInstallButton-button');
    expect(button).toHaveClass('AMInstallButton-button--enable');
  });

  it('renders a "Add to Firefox" button when add-on is INACTIVE', () => {
    render({ status: INACTIVE });

    expect(getLink('Add to Firefox')).not.toHaveAttribute('disabled');
  });

  it("renders custom button text when it's passed in", () => {
    const defaultButtonText = 'Install here';

    render({ defaultButtonText });

    expect(getLink(defaultButtonText)).not.toHaveAttribute('disabled');
  });

  it.each([DOWNLOADING, DISABLING, ENABLING, INSTALLING, UNINSTALLING])(
    'renders a loading Icon when add-on is %s',
    (status) => {
      render({ status });

      expect(
        screen.queryByClassName('AMInstallButton-button'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByClassName('AMInstallButton-loading-button'),
      ).toBeInTheDocument();
      expect(
        screen.getByClassName('AMInstallButton-loader-container'),
      ).toBeInTheDocument();
    },
  );

  it.each([
    [DOWNLOADING, 'Downloading'],
    [ENABLING, 'Enabling'],
    [INSTALLING, 'Installing'],
    [UNINSTALLING, 'Uninstalling'],
  ])('sets an `alt` prop to the Icon when status is %s', (status, title) => {
    render({ status });

    expect(screen.getByTitle(title)).toBeInTheDocument();
    expect(screen.getByText(title)).toHaveClass('visually-hidden');
  });

  it('calls the `uninstall` helper when uninstalling an add-on', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const uninstall = jest.fn();

    render({
      addon,
      uninstall,
      status: INSTALLED,
    });

    expect(uninstall).not.toHaveBeenCalled();

    const button = getLink('Remove');

    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

    fireEvent(button, clickEvent);

    expect(uninstall).toHaveBeenCalledTimes(1);
    expect(uninstall).toHaveBeenCalledWith({
      guid: addon.guid,
      name: addon.name,
      type: addon.type,
    });
    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(stopPropagationWatcher).toHaveBeenCalled();
  });

  it('calls the `enable` helper when enabling an add-on', () => {
    const enable = jest.fn();

    render({ enable, status: DISABLED });

    expect(enable).not.toHaveBeenCalled();

    const button = getLink('Enable');

    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

    fireEvent(button, clickEvent);

    expect(enable).toHaveBeenCalledTimes(1);
    // `enable` should be called with NO arguments.
    expect(enable).toHaveBeenCalledWith();
    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(stopPropagationWatcher).toHaveBeenCalled();
  });

  it('accepts an extra CSS class name', () => {
    const className = 'foo-bar';
    render({ className });

    expect(screen.getByClassName('AMInstallButton')).toHaveClass(className);
  });
});
