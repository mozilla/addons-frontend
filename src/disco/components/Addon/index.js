/* @flow */
import config from 'config';
import makeClassName from 'classnames';
import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import AddonCompatibilityError from 'disco/components/AddonCompatibilityError';
import InstallButton from 'core/components/InstallButton';
import AMInstallButton from 'core/components/AMInstallButton';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLICK_CATEGORY,
  ERROR,
  INSTALL_SOURCE_DISCOVERY,
  UNINSTALLED,
  UNKNOWN,
  validAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { withInstallHelpers } from 'core/installAddon';
import { getAddonByID } from 'core/reducers/addons';
import tracking, { getAddonTypeForTracking } from 'core/tracking';
import { getThemeData } from 'core/themeInstall';
import { isTheme } from 'core/utils';
import { getErrorMessage } from 'core/utils/addons';
import { sanitizeHTMLWithExternalLinks } from 'disco/utils';
import { getClientCompatibility } from 'core/utils/compatibility';
import LoadingText from 'ui/components/LoadingText';
import ThemeImage from 'ui/components/ThemeImage';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { InstalledAddon } from 'core/reducers/installations';
import type { WithInstallHelpersInjectedProps } from 'core/installAddon';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'disco/store';
import type { DiscoResultType } from 'disco/reducers/discoResults';

import './styles.scss';

const CSS_TRANSITION_TIMEOUT = { enter: 700, exit: 300 };

type Props = {|
  addonId: $PropertyType<DiscoResultType, 'addonId'>,
  description: $PropertyType<DiscoResultType, 'description'>,
  heading: $PropertyType<DiscoResultType, 'heading'>,
|};

type InternalProps = {|
  ...Props,
  ...WithInstallHelpersInjectedProps,
  _config: typeof config,
  _getClientCompatibility: typeof getClientCompatibility,
  _tracking: typeof tracking,
  addon: AddonType,
  clientApp: string,
  defaultInstallSource: string,
  error: string | void,
  i18n: I18nType,
  status: $PropertyType<InstalledAddon, 'status'>,
  userAgentInfo: UserAgentInfoType,
|};

export class AddonBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
    _tracking: tracking,
    _getClientCompatibility: getClientCompatibility,
  };

  getError() {
    const { error, i18n, status } = this.props;

    return status === ERROR ? (
      <CSSTransition
        classNames="overlay"
        key="error-overlay"
        timeout={CSS_TRANSITION_TIMEOUT}
      >
        <div className="notification error">
          <p className="message">{getErrorMessage({ i18n, error })}</p>
          {error && !error.startsWith('FATAL') ? (
            // eslint-disable-next-line jsx-a11y/href-no-hash, jsx-a11y/anchor-is-valid
            <a className="close" href="#" onClick={this.closeError}>
              {i18n.gettext('Close')}
            </a>
          ) : null}
        </div>
      </CSSTransition>
    ) : null;
  }

  getLogo() {
    const { addon } = this.props;

    if (addon && addon.type === ADDON_TYPE_EXTENSION) {
      return (
        <div className="logo">
          <img src={addon.icon_url} alt="" />
        </div>
      );
    }

    return null;
  }

  getThemeImage() {
    const { addon, hasAddonManager } = this.props;

    if (!addon || !isTheme(addon.type)) {
      return null;
    }

    let imageLinkProps = {
      className: 'Addon-ThemeImage-link',
      href: '#',
      onClick: this.installStaticTheme,
    };

    if (addon.type === ADDON_TYPE_THEME) {
      imageLinkProps = {
        ...imageLinkProps,
        onClick: this.installTheme,
        'data-browsertheme': JSON.stringify(getThemeData(addon)),
      };
    }

    const themeImage = <ThemeImage addon={addon} />;

    return hasAddonManager ? (
      <a {...imageLinkProps}>{themeImage}</a>
    ) : (
      // The `span` is needed to avoid an issue when the client hydrates the
      // app after having received the server DOM.
      <span>{themeImage}</span>
    );
  }

  getDescription() {
    const { addon, description } = this.props;

    if (!addon || isTheme(addon.type)) {
      return null;
    }

    return (
      <div
        className="editorial-description"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={sanitizeHTMLWithExternalLinks(description, [
          'a',
          'blockquote',
          'cite',
        ])}
      />
    );
  }

  installTheme = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    const { addon, installTheme, status } = this.props;

    installTheme(event.currentTarget, {
      name: addon.name,
      status,
      type: addon.type,
    });
  };

  closeError = (e: SyntheticEvent<any>) => {
    e.preventDefault();

    this.props.setCurrentStatus();
  };

  clickHeadingLink = (e: SyntheticEvent<HTMLAnchorElement>) => {
    const { addon, _tracking } = this.props;

    if (
      e.target &&
      // $FLOW_FIXME: the `nodeName` might be available
      e.target.nodeName &&
      e.target.nodeName.toLowerCase() === 'a'
    ) {
      _tracking.sendEvent({
        action: getAddonTypeForTracking(addon.type),
        category: CLICK_CATEGORY,
        label: addon.name,
      });
    }
  };

  installStaticTheme = async (event: SyntheticEvent<any>) => {
    const { enable, isAddonEnabled, install, status } = this.props;
    event.preventDefault();

    if (status === UNINSTALLED) {
      await install();
    }

    const isEnabled = await isAddonEnabled();

    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1477328.
    if (!isEnabled) {
      await enable();
    }
  };

  render() {
    const {
      _config,
      _getClientCompatibility,
      addon,
      clientApp,
      defaultInstallSource,
      enable,
      hasAddonManager,
      heading,
      install,
      installTheme,
      isAddonEnabled,
      setCurrentStatus,
      status,
      uninstall,
      userAgentInfo,
    } = this.props;

    const type = addon ? addon.type : undefined;

    if (typeof type !== 'undefined' && !validAddonTypes.includes(type)) {
      throw new Error(`Invalid addon type "${type}"`);
    }

    const addonClasses = makeClassName('addon', {
      theme: isTheme(type),
      extension: type === ADDON_TYPE_EXTENSION,
    });

    if (!addon) {
      return (
        <div className={addonClasses}>
          <div className="content">
            <div className="copy">
              <LoadingText />
            </div>
          </div>
        </div>
      );
    }

    const { compatible, reason } = _getClientCompatibility({
      addon,
      clientApp,
      userAgentInfo,
    });

    return (
      <div className={addonClasses}>
        {this.getThemeImage()}

        {this.getLogo()}

        <div className="content">
          <TransitionGroup>{this.getError()}</TransitionGroup>

          <div className="copy">
            {/* Disabling this is fine since the onClick is just being used to
            delegate click events bubbling from the link within the header. */}
            {/* eslint-disable-next-line max-len */}
            {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
            <h2
              onClick={this.clickHeadingLink}
              className="heading"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTMLWithExternalLinks(heading, [
                'a',
                'span',
              ])}
            />
            {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions *}
            {/* eslint-enable jsx-a11y/click-events-have-key-events */}
            {this.getDescription()}
          </div>

          {_config.get('enableFeatureAMInstallButton') ? (
            <AMInstallButton
              addon={addon}
              className="Addon-install-button"
              defaultInstallSource={defaultInstallSource}
              disabled={!compatible}
              enable={enable}
              hasAddonManager={hasAddonManager}
              install={install}
              installTheme={installTheme}
              isAddonEnabled={isAddonEnabled}
              puffy={false}
              setCurrentStatus={setCurrentStatus}
              status={status || UNKNOWN}
              uninstall={uninstall}
            />
          ) : (
            <InstallButton
              {...this.props.addon}
              {...this.props}
              className="Addon-install-button"
              defaultInstallSource={defaultInstallSource}
              size="small"
            />
          )}
        </div>

        {!compatible ? <AddonCompatibilityError reason={reason} /> : null}
      </div>
    );
  }
}

function mapStateToProps(state: AppState, ownProps: Props) {
  const addon = getAddonByID(state, ownProps.addonId);

  let installation = {};
  if (addon) {
    installation = state.installations[addon.guid] || {};
  }

  return {
    addon,
    error: installation.error,
    status: installation.status || UNKNOWN,
    clientApp: state.api.clientApp,
    // In addition to this component, this also is required by the
    // `withInstallHelpers()` HOC.
    userAgentInfo: state.api.userAgentInfo,
  };
}

const Addon: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_DISCOVERY }),
)(AddonBase);

export default Addon;
