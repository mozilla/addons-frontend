/* @flow */
/* global window */
import makeClassName from 'classnames';
import config from 'config';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import {
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  DISABLED,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  INSTALLED,
  INSTALLING,
  INSTALL_ACTION,
  INSTALL_STARTED_ACTION,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { findInstallURL } from 'core/installAddon';
import log from 'core/logger';
import { getThemeData } from 'core/themeInstall';
import tracking, {
  getAddonTypeForTracking,
  getAddonEventCategory,
} from 'core/tracking';
import { isTheme } from 'core/utils';
import AnimatedIcon from 'ui/components/AnimatedIcon';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';
import type { AppState } from 'amo/store';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType,
  className?: string,
  defaultInstallSource: string,
  disabled: boolean,
  location: ReactRouterLocationType,
  puffy: boolean,
  status: string,
  // From `withInstallHelpers()`, see: `src/core/installAddon.js`.
  enable: () => Promise<any>,
  hasAddonManager: boolean,
  install: () => Promise<any>,
  installTheme: (HTMLAnchorElement, Object) => Promise<any>,
  uninstall: (Object) => Promise<any>,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _log: typeof log,
  _tracking: typeof tracking,
  _window: typeof window,
  i18n: I18nType,
  userAgentInfo: string,
|};

type TrackParams = {|
  addonName: string,
  type: string,
|};

type ButtonProps = {|
  buttonType: string,
  className: string,
  'data-browsertheme'?: string,
  disabled: boolean,
  href: string,
  onClick: Function | null,
  puffy: boolean,
|};

export class NewInstallButtonBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
    _log: log,
    _tracking: tracking,
    _window: typeof window !== 'undefined' ? window : {},
    puffy: true,
  };

  installTheme = (event: SyntheticEvent<HTMLAnchorElement>) => {
    const { addon, status, installTheme } = this.props;

    event.preventDefault();
    event.stopPropagation();

    installTheme(event.currentTarget, { ...addon, status });
  };

  installOpenSearch = (event: SyntheticEvent<HTMLAnchorElement>) => {
    const { _log, _window, addon } = this.props;

    event.preventDefault();
    event.stopPropagation();

    const installURL = event.currentTarget.href;

    _log.info('Adding OpenSearch Provider', { addon });
    _window.external.AddSearchProvider(installURL);

    this.trackInstallStarted({
      addonName: addon.name,
      type: addon.type,
    });

    return false;
  };

  installExtension = async (event: SyntheticEvent<HTMLAnchorElement>) => {
    const { addon, enable, install } = this.props;

    event.preventDefault();
    event.stopPropagation();

    await install();

    if (addon.type === ADDON_TYPE_STATIC_THEME) {
      await enable();
    }

    return false;
  };

  uninstallAddon = (event: SyntheticEvent<HTMLAnchorElement>) => {
    const { addon, uninstall } = this.props;
    const { guid, name, type } = addon;

    event.preventDefault();
    event.stopPropagation();

    const installURL = event.currentTarget.href;

    uninstall({ guid, installURL, name, type });

    return false;
  };

  enableAddon = (event: SyntheticEvent<HTMLAnchorElement>) => {
    const { enable } = this.props;

    event.preventDefault();
    event.stopPropagation();

    enable();

    return false;
  };

  trackInstallStarted({ addonName, type }: TrackParams) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: getAddonTypeForTracking(type),
      category: getAddonEventCategory(type, INSTALL_STARTED_ACTION),
      label: addonName,
    });
  }

  trackInstallSucceeded({ addonName, type }: TrackParams) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: getAddonTypeForTracking(type),
      category: getAddonEventCategory(type, INSTALL_ACTION),
      label: addonName,
    });
  }

  showLoadingAnimation() {
    const { addon, status } = this.props;

    if (addon.type === ADDON_TYPE_STATIC_THEME && status === INSTALLED) {
      // We have to enable a static theme after having installed it, so we keep
      // the animation visible to avoid flickering.
      return true;
    }

    return [DOWNLOADING, ENABLING, INSTALLING, UNINSTALLING].includes(status);
  }

  getButtonText() {
    const { addon, i18n, status } = this.props;

    switch (status) {
      case DISABLED:
        return i18n.gettext('Enable');
      case ENABLED:
      case INSTALLED:
        return i18n.gettext('Remove');
      case ENABLING:
        return i18n.gettext('Enabling');
      case DOWNLOADING:
        return i18n.gettext('Downloading');
      case INSTALLING:
        return i18n.gettext('Installing');
      case UNINSTALLING:
        return i18n.gettext('Uninstalling');
      default:
        return isTheme(addon.type)
          ? i18n.gettext('Install Theme')
          : i18n.gettext('Add to Firefox');
    }
  }

  getIconName() {
    const { status } = this.props;

    switch (status) {
      case DISABLED:
        return 'plus-dark';
      case ENABLED:
      case INSTALLED:
        return 'delete';
      default:
        return 'plus';
    }
  }

  render() {
    const {
      _config,
      _log,
      addon,
      className,
      defaultInstallSource,
      disabled,
      hasAddonManager,
      location,
      status,
      userAgentInfo,
    } = this.props;

    if (addon.type === ADDON_TYPE_OPENSEARCH && _config.get('server')) {
      _log.info('Not rendering opensearch install button on the server');
      return null;
    }

    const installURL = findInstallURL({
      defaultInstallSource,
      location,
      platformFiles: addon.platformFiles,
      userAgentInfo,
    });

    const buttonIsDisabled =
      disabled === false ? hasAddonManager && status === UNKNOWN : disabled;

    const buttonProps: ButtonProps = {
      buttonType: 'action',
      className: 'NewInstallButton-button',
      disabled: buttonIsDisabled,
      href: installURL,
      onClick: hasAddonManager
        ? (event) => {
            event.preventDefault();
            event.stopPropagation();

            return false;
          }
        : null,
      puffy: this.props.puffy,
    };

    if (!buttonIsDisabled) {
      if ([ENABLED, INSTALLED].includes(status)) {
        buttonProps.buttonType = 'neutral';
        buttonProps.onClick = this.uninstallAddon;
        buttonProps.className = makeClassName(
          buttonProps.className,
          'NewInstallButton-button--uninstall',
        );
      } else if (status === DISABLED) {
        buttonProps.buttonType = 'neutral';
        buttonProps.onClick = this.enableAddon;
        buttonProps.className = makeClassName(
          buttonProps.className,
          'NewInstallButton-button--enable',
        );
      } else if (addon.type === ADDON_TYPE_THEME) {
        buttonProps['data-browsertheme'] = JSON.stringify(getThemeData(addon));
        buttonProps.onClick = this.installTheme;
      } else if (hasAddonManager) {
        buttonProps.onClick =
          addon.type === ADDON_TYPE_OPENSEARCH
            ? this.installOpenSearch
            : this.installExtension;
      }
    }

    return (
      <div className={makeClassName('NewInstallButton', className)}>
        {this.showLoadingAnimation() ? (
          <div
            className={makeClassName('NewInstallButton-loading', {
              'NewInstallButton-loading--puffy': this.props.puffy,
            })}
          >
            <AnimatedIcon alt={this.getButtonText()} name="loading" />
          </div>
        ) : (
          <Button {...buttonProps}>
            <Icon name={this.getIconName()} />
            {this.getButtonText()}
          </Button>
        )}
      </div>
    );
  }
}

export function mapStateToProps(state: AppState) {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

const NewInstallButton: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(NewInstallButtonBase);

export default NewInstallButton;
