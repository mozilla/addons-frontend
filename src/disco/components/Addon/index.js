/* eslint-disable react/no-danger */
import config from 'config';
import makeClassName from 'classnames';
import { sprintf } from 'jed';
import * as React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import AddonCompatibilityError from 'disco/components/AddonCompatibilityError';
import InstallButton from 'core/components/InstallButton';
import NewInstallButton from 'core/components/NewInstallButton';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLICK_CATEGORY,
  DOWNLOAD_FAILED,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  INSTALL_SOURCE_DISCOVERY,
  UNINSTALLING,
  UNKNOWN,
  validAddonTypes,
  validInstallStates,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { getPreviewImage } from 'core/imageUtils';
import { withInstallHelpers } from 'core/installAddon';
import { getAddonByGUID } from 'core/reducers/addons';
import tracking, { getAddonTypeForTracking } from 'core/tracking';
import { isTheme } from 'core/utils';
import { sanitizeHTMLWithExternalLinks } from 'disco/utils';
import { getClientCompatibility as _getClientCompatibility } from 'core/utils/compatibility';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';

const CSS_TRANSITION_TIMEOUT = { enter: 700, exit: 300 };

export class AddonBase extends React.Component {
  static propTypes = {
    _config: PropTypes.object,
    _tracking: PropTypes.object,
    addon: PropTypes.object.isRequired,
    clientApp: PropTypes.string.isRequired,
    // This is added by withInstallHelpers()
    defaultInstallSource: PropTypes.string.isRequired,
    description: PropTypes.string,
    enable: PropTypes.func.isRequired,
    error: PropTypes.string,
    getBrowserThemeData: PropTypes.func.isRequired,
    getClientCompatibility: PropTypes.func,
    heading: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
    iconUrl: PropTypes.string,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    needsRestart: PropTypes.bool,
    // eslint-disable-next-line react/no-unused-prop-types
    platformFiles: PropTypes.object,
    setCurrentStatus: PropTypes.func.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
    uninstall: PropTypes.func.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  };

  static defaultProps = {
    _config: config,
    _tracking: tracking,
    getClientCompatibility: _getClientCompatibility,
    needsRestart: false,
    platformFiles: {},
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
          <p className="message">{this.errorMessage()}</p>
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

  getRestart() {
    return this.props.needsRestart ? (
      <CSSTransition
        classNames="overlay"
        key="restart-overlay"
        timeout={CSS_TRANSITION_TIMEOUT}
      >
        <div className="notification restart">
          <p className="message">{this.restartMessage()}</p>
        </div>
      </CSSTransition>
    ) : null;
  }

  getLogo() {
    const { iconUrl } = this.props;
    if (this.props.type === ADDON_TYPE_EXTENSION) {
      return (
        <div className="logo">
          <img src={iconUrl} alt="" />
        </div>
      );
    }
    return null;
  }

  getThemeImage() {
    const { addon } = this.props;
    const { type } = addon;

    if (isTheme(type)) {
      const { getBrowserThemeData, i18n } = this.props;
      const { name, previewURL } = addon;

      let imageUrl = getPreviewImage(addon);

      if (!imageUrl && type === ADDON_TYPE_THEME) {
        imageUrl = previewURL;
      }

      const headerImage = (
        <img
          alt={sprintf(i18n.gettext('Preview of %(name)s'), { name })}
          className="Addon-theme-header-image"
          src={imageUrl}
        />
      );

      /* eslint-disable jsx-a11y/href-no-hash, jsx-a11y/anchor-is-valid */
      return type === ADDON_TYPE_THEME ? (
        <a
          className="theme-image"
          data-browsertheme={getBrowserThemeData()}
          href="#"
          onClick={this.installTheme}
        >
          {headerImage}
        </a>
      ) : (
        headerImage
      );
    }

    return null;
  }

  getDescription() {
    const { description, type } = this.props;

    if (isTheme(type)) {
      return null;
    }

    return (
      <div
        className="editorial-description"
        dangerouslySetInnerHTML={sanitizeHTMLWithExternalLinks(description, [
          'a',
          'blockquote',
          'cite',
        ])}
      />
    );
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, installTheme, status } = this.props;
    installTheme(event.currentTarget, { ...addon, status });
  };

  errorMessage() {
    const { error, i18n } = this.props;
    switch (error) {
      case INSTALL_FAILED:
        return i18n.gettext('Installation failed. Please try again.');
      case DOWNLOAD_FAILED:
        return i18n.gettext('Download failed. Please check your connection.');
      case FATAL_INSTALL_ERROR:
        return i18n.gettext(
          'An unexpected error occurred during installation.',
        );
      case FATAL_UNINSTALL_ERROR:
        return i18n.gettext(
          'An unexpected error occurred during uninstallation.',
        );
      case FATAL_ERROR:
      default:
        return i18n.gettext('An unexpected error occurred.');
    }
  }

  restartMessage() {
    const { status, i18n } = this.props;
    switch (status) {
      case UNINSTALLING:
        return i18n.gettext(
          'This add-on will be uninstalled after you restart Firefox.',
        );
      default:
        return i18n.gettext('Please restart Firefox to use this add-on.');
    }
  }

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

  render() {
    const {
      _config,
      addon,
      clientApp,
      defaultInstallSource,
      enable,
      getClientCompatibility,
      heading,
      install,
      installTheme,
      status,
      type,
      uninstall,
      userAgentInfo,
    } = this.props;

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
          <TransitionGroup>
            {this.getError()}
            {this.getRestart()}
          </TransitionGroup>
          <div className="copy">
            <h2
              onClick={this.clickHeadingLink}
              className="heading"
              dangerouslySetInnerHTML={sanitizeHTMLWithExternalLinks(heading, [
                'a',
                'span',
              ])}
            />
            {this.getDescription()}
          </div>
          {_config.get('enableNewInstallButton') ? (
            <NewInstallButton
              addon={addon}
              className="Addon-install-button"
              defaultInstallSource={defaultInstallSource}
              disabled={!compatible}
              enable={enable}
              install={install}
              installTheme={installTheme}
              puffy={false}
              status={status || UNKNOWN}
              uninstall={uninstall}
            />
          ) : (
            <InstallButton
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
  // `ownProps.guid` is already "normalized" with `getGuid()` in the
  // `DiscoPane` container component.
  const installation = state.installations[ownProps.guid];
  const addon = getAddonByGUID(state, ownProps.guid);

  return {
    addon,
    ...addon,
    ...installation,
    clientApp: state.api.clientApp,
    // This is required by the `withInstallHelpers()` HOC, apparently...
    platformFiles: addon ? addon.platformFiles : {},
    userAgentInfo: state.api.userAgentInfo,
  };
}

export default compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_DISCOVERY }),
)(AddonBase);
