/* eslint-disable react/no-danger */
import config from 'config';
import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
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
  validInstallStates,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { withInstallHelpers } from 'core/installAddon';
import tracking, { getAddonTypeForTracking } from 'core/tracking';
import { isTheme } from 'core/utils';
import { getErrorMessage } from 'core/utils/addons';
import { sanitizeHTMLWithExternalLinks } from 'disco/utils';
import { getClientCompatibility as _getClientCompatibility } from 'core/utils/compatibility';
import LoadingText from 'ui/components/LoadingText';
import ThemeImage from 'ui/components/ThemeImage';

import './styles.scss';

const CSS_TRANSITION_TIMEOUT = { enter: 700, exit: 300 };

export class AddonBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    _tracking: PropTypes.object,
    addon: PropTypes.shape({
      description: PropTypes.string,
      heading: PropTypes.string.isRequired,
      icon_url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      platformFiles: PropTypes.object,
      type: PropTypes.oneOf(validAddonTypes).isRequired,
    }),
    clientApp: PropTypes.string.isRequired,
    defaultInstallSource: PropTypes.string.isRequired,
    enable: PropTypes.func.isRequired,
    error: PropTypes.string,
    getBrowserThemeData: PropTypes.func.isRequired,
    getClientCompatibility: PropTypes.func,
    hasAddonManager: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    isAddonEnabled: PropTypes.func,
    setCurrentStatus: PropTypes.func.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    uninstall: PropTypes.func.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  };

  static defaultProps = {
    _config: config,
    _tracking: tracking,
    getClientCompatibility: _getClientCompatibility,
  };

  getError() {
    const { error, i18n, status } = this.props;
    const errorMessage = getErrorMessage({ i18n, error });

    return status === ERROR ? (
      <CSSTransition
        classNames="overlay"
        key="error-overlay"
        timeout={CSS_TRANSITION_TIMEOUT}
      >
        <div className="notification error">
          <p className="message">{errorMessage}</p>
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
    const { addon, getBrowserThemeData, hasAddonManager } = this.props;

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
        'data-browsertheme': getBrowserThemeData(),
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
    const { addon } = this.props;

    if (!addon || isTheme(addon.type)) {
      return null;
    }

    return (
      <div
        className="editorial-description"
        dangerouslySetInnerHTML={sanitizeHTMLWithExternalLinks(
          addon.description,
          ['a', 'blockquote', 'cite'],
        )}
      />
    );
  }

  installTheme = (event) => {
    event.preventDefault();

    const { addon, installTheme, status } = this.props;

    installTheme(event.currentTarget, {
      name: addon.name,
      status,
      type: addon.type,
    });
  };

  closeError = (e) => {
    e.preventDefault();
    this.props.setCurrentStatus();
  };

  clickHeadingLink = (e) => {
    const { addon, _tracking } = this.props;

    if (e.target.nodeName.toLowerCase() === 'a') {
      _tracking.sendEvent({
        action: getAddonTypeForTracking(addon.type),
        category: CLICK_CATEGORY,
        label: addon.name,
      });
    }
  };

  installStaticTheme = async (event) => {
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
      addon,
      clientApp,
      defaultInstallSource,
      enable,
      getClientCompatibility,
      hasAddonManager,
      install,
      installTheme,
      isAddonEnabled,
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

    const { compatible, minVersion, reason } = getClientCompatibility({
      addon,
      clientApp,
      userAgentInfo,
    });

    return (
      // Disabling this is fine since the onClick is just being used to delegate
      // click events bubbling from the link within the header.
      // eslint-disable-next-line max-len
      /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
      <div className={addonClasses}>
        {this.getThemeImage()}
        {this.getLogo()}
        <div className="content">
          <TransitionGroup>{this.getError()}</TransitionGroup>

          <div className="copy">
            <h2
              onClick={this.clickHeadingLink}
              className="heading"
              dangerouslySetInnerHTML={sanitizeHTMLWithExternalLinks(
                addon.heading,
                ['a', 'span'],
              )}
            />
            {this.getDescription()}
          </div>

          {_config.get('enableAMInstallButton') ? (
            <AMInstallButton
              addon={addon}
              className="Addon-install-button"
              defaultInstallSource={defaultInstallSource}
              disabled={!compatible}
              enable={enable}
              hasAddonManager={hasAddonManager}
              install={install}
              installTheme={installTheme}
              puffy={false}
              status={status || UNKNOWN}
              uninstall={uninstall}
              isAddonEnabled={isAddonEnabled}
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

        {!compatible ? (
          <AddonCompatibilityError minVersion={minVersion} reason={reason} />
        ) : null}
      </div>
      // eslint-disable-next-line max-len
      /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
    );
  }
}

export function mapStateToProps(state, ownProps) {
  let installation = {};
  if (ownProps.addon) {
    installation = state.installations[ownProps.addon.guid] || {};
  }

  return {
    error: installation.error,
    status: installation.status || UNKNOWN,
    clientApp: state.api.clientApp,
    // In addition to this component, this also is required by the
    // `withInstallHelpers()` HOC.
    userAgentInfo: state.api.userAgentInfo,
  };
}

export default compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_DISCOVERY }),
)(AddonBase);
