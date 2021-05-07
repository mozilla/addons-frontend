/* @flow */
/* global window */
import makeClassName from 'classnames';
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

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
  INSTALL_ACTION,
  INSTALL_STARTED_ACTION,
  UNINSTALLING,
  UNKNOWN,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { findInstallURL } from 'amo/installAddon';
import log from 'amo/logger';
import tracking, {
  getAddonTypeForTracking,
  getAddonEventCategory,
} from 'amo/tracking';
import { isFirefox } from 'amo/utils/compatibility';
import Button from 'amo/components/Button';
import type { WithInstallHelpersInjectedProps } from 'amo/installAddon';
import type { ButtonType } from 'amo/components/Button';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { AnchorEvent, ElementEvent } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  ...WithInstallHelpersInjectedProps,
  addon: AddonType,
  canUninstall: boolean | void,
  className?: string,
  currentVersion: AddonVersionType | null,
  defaultButtonText?: string,
  disabled: boolean,
  puffy?: boolean,
  status: string,
|};

type DefaultProps = {|
  _config: typeof config,
  _log: typeof log,
  _tracking: typeof tracking,
  _window: typeof window,
  puffy?: boolean,
|};

type PropsFromState = {|
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

type TrackParams = {|
  guid: string,
  type: string,
|};

type ButtonProps = {|
  buttonType: ButtonType,
  className: string,
  disabled: boolean,
  href: string | void,
  onClick: Function | null,
  puffy: boolean,
|};

type EventHandler = (event: ElementEvent) => boolean;
type AsyncEventHandler = (event: ElementEvent) => Promise<boolean>;

const TRANSITION_TIMEOUT = 150;

export class AMInstallButtonBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _config: config,
    _log: log,
    _tracking: tracking,
    _window: typeof window !== 'undefined' ? window : {},
    puffy: true,
  };

  installOpenSearch: (event: AnchorEvent) => boolean = (event: AnchorEvent) => {
    const { _log, _window, addon } = this.props;

    event.preventDefault();
    event.stopPropagation();

    const installURL = event.currentTarget.href;

    // eslint-disable-next-line amo/only-log-strings
    _log.info('Adding OpenSearch Provider', { addon });
    _window.external.AddSearchProvider(installURL);

    const { guid, type } = addon;

    this.trackInstallStarted({ guid, type });
    this.trackInstallSucceeded({ guid, type });

    return false;
  };

  installExtension: AsyncEventHandler = async (event: ElementEvent) => {
    const { addon, enable, install, isAddonEnabled } = this.props;

    event.preventDefault();
    event.stopPropagation();

    await install();

    if (ADDON_TYPE_STATIC_THEME === addon.type) {
      const isEnabled = await isAddonEnabled();

      if (!isEnabled) {
        await enable({ sendTrackingEvent: false });
      }
    }

    return false;
  };

  uninstallAddon: EventHandler = (event: ElementEvent) => {
    const { addon, uninstall } = this.props;
    const { guid, name, type } = addon;

    event.preventDefault();
    event.stopPropagation();

    uninstall({ guid, name, type });

    return false;
  };

  enableAddon: EventHandler = (event: ElementEvent) => {
    const { enable } = this.props;

    event.preventDefault();
    event.stopPropagation();

    enable();

    return false;
  };

  trackInstallStarted({ guid, type }: TrackParams) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: getAddonTypeForTracking(type),
      category: getAddonEventCategory(type, INSTALL_STARTED_ACTION),
      label: guid,
    });
  }

  trackInstallSucceeded({ guid, type }: TrackParams) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: getAddonTypeForTracking(type),
      category: getAddonEventCategory(type, INSTALL_ACTION),
      label: guid,
    });
  }

  showLoadingAnimation(): boolean {
    const { addon, status } = this.props;

    if (ADDON_TYPE_STATIC_THEME === addon.type && status === INSTALLED) {
      // We have to enable a static theme after having installed it, so we keep
      // the animation visible to avoid flickering.
      return true;
    }

    return [
      DISABLING,
      DOWNLOADING,
      ENABLING,
      INSTALLING,
      UNINSTALLING,
    ].includes(status);
  }

  getButtonText(): string {
    const { addon, i18n, status, defaultButtonText } = this.props;

    switch (status) {
      case DISABLED:
        return i18n.gettext('Enable');
      case ENABLED:
      case INSTALLED:
        return i18n.gettext('Remove');
      case ENABLING:
        return i18n.gettext('Enabling');
      case DISABLING:
        return i18n.gettext('Disabling');
      case DOWNLOADING:
        return i18n.gettext('Downloading');
      case INSTALLING:
        return i18n.gettext('Installing');
      case UNINSTALLING:
        return i18n.gettext('Uninstalling');
      case INACTIVE:
      default:
        if (defaultButtonText) {
          return defaultButtonText;
        }

        return ADDON_TYPE_STATIC_THEME === addon.type
          ? i18n.gettext('Install Theme')
          : i18n.gettext('Add to Firefox');
    }
  }

  render(): null | React.Node {
    const {
      canUninstall,
      className,
      currentVersion,
      disabled,
      hasAddonManager,
      status,
      userAgentInfo,
    } = this.props;

    if (!isFirefox({ userAgentInfo })) {
      return null;
    }

    const installURL =
      currentVersion && currentVersion.file
        ? findInstallURL({
            file: currentVersion.file,
          })
        : undefined;

    const buttonIsDisabled =
      disabled === true || !installURL
        ? true
        : hasAddonManager && status === UNKNOWN;

    invariant(this.props.puffy !== undefined, 'puffy prop is required');
    const buttonProps: ButtonProps = {
      buttonType: 'action',
      className: 'AMInstallButton-button',
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
        buttonProps.className = makeClassName(
          buttonProps.className,
          'AMInstallButton-button--uninstall',
        );

        if (canUninstall === false) {
          buttonProps.disabled = true;
        } else {
          buttonProps.onClick = this.uninstallAddon;
        }
      } else if (status === DISABLED) {
        buttonProps.buttonType = 'neutral';
        buttonProps.onClick = this.enableAddon;
        buttonProps.className = makeClassName(
          buttonProps.className,
          'AMInstallButton-button--enable',
        );
      } else if (hasAddonManager) {
        buttonProps.onClick = this.installExtension;
      }
    }

    const transitionProps = {
      classNames: 'AMInstallButton-transition',
      timeout: TRANSITION_TIMEOUT,
    };

    const buttonText = this.getButtonText();

    return (
      <TransitionGroup className={makeClassName('AMInstallButton', className)}>
        {this.showLoadingAnimation() ? (
          <CSSTransition key="loading" {...transitionProps}>
            <div
              className={makeClassName('AMInstallButton-loading-button', {
                'AMInstallButton-loading-button--puffy': this.props.puffy,
              })}
              title={buttonText}
            >
              <div className="AMInstallButton-loader">
                <div className="AMInstallButton-loader-container">
                  <div className="AMInstallButton-loader-ball" />
                </div>
                <span className="visually-hidden">{buttonText}</span>
              </div>
            </div>
          </CSSTransition>
        ) : (
          <CSSTransition key="button" {...transitionProps}>
            <Button {...buttonProps}>{buttonText}</Button>
          </CSSTransition>
        )}
      </TransitionGroup>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

const AMInstallButton: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AMInstallButtonBase);

export default AMInstallButton;
