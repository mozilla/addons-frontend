/* eslint-disable react/no-danger */

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
  validAddonTypes,
  validInstallStates,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { withInstallHelpers } from 'core/installAddon';
import { getAddonByGUID } from 'core/reducers/addons';
import tracking, { getAddonTypeForTracking } from 'core/tracking';
import { sanitizeHTMLWithExternalLinks } from 'disco/utils';
import { getClientCompatibility as _getClientCompatibility } from 'core/utils/compatibility';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';

const CSS_TRANSITION_TIMEOUT = { enter: 700, exit: 300 };

export class AddonBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    clientApp: PropTypes.string.isRequired,
    // This is added by withInstallHelpers()
    defaultInstallSource: PropTypes.string.isRequired,
    description: PropTypes.string,
    error: PropTypes.string,
    heading: PropTypes.string.isRequired,
    getBrowserThemeData: PropTypes.func.isRequired,
    getClientCompatibility: PropTypes.func,
    i18n: PropTypes.object.isRequired,
    iconUrl: PropTypes.string,
    installTheme: PropTypes.func.isRequired,
    platformFiles: PropTypes.object,
    // See ReactRouterLocationType in 'core/types/router'
    location: PropTypes.object.isRequired,
    needsRestart: PropTypes.bool,
    previewURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    setCurrentStatus: PropTypes.func.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
    userAgentInfo: PropTypes.object.isRequired,
    _tracking: PropTypes.object,
  };

  static defaultProps = {
    getClientCompatibility: _getClientCompatibility,
    platformFiles: {},
    needsRestart: false,
    _tracking: tracking,
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
    const { getBrowserThemeData, i18n, name, previewURL } = this.props;
    if (this.props.type === ADDON_TYPE_THEME) {
      /* eslint-disable jsx-a11y/href-no-hash, jsx-a11y/anchor-is-valid */
      return (
        <a
          href="#"
          className="theme-image"
          data-browsertheme={getBrowserThemeData()}
          onClick={this.installTheme}
        >
          <img
            src={previewURL}
            alt={sprintf(i18n.gettext('Preview of %(name)s'), { name })}
          />
        </a>
      );
      /* eslint-enable jsx-a11y/href-no-hash, jsx-a11y/anchor-is-valid */
    }
    return null;
  }

  getDescription() {
    const { description, type } = this.props;

    if (type === ADDON_TYPE_THEME) {
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
    const { type, name, _tracking } = this.props;

    if (e.target.nodeName.toLowerCase() === 'a') {
      _tracking.sendEvent({
        action: getAddonTypeForTracking(type),
        category: CLICK_CATEGORY,
        label: name,
      });
    }
  };

  render() {
    const {
      addon,
      clientApp,
      defaultInstallSource,
      getClientCompatibility,
      heading,
      type,
      userAgentInfo,
    } = this.props;

    if (typeof type !== 'undefined' && !validAddonTypes.includes(type)) {
      throw new Error(`Invalid addon type "${type}"`);
    }

    const addonClasses = makeClassName('addon', {
      theme: type === ADDON_TYPE_THEME,
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
          {/* TODO: find the courage to remove {...this.props} */}
          <InstallButton
            {...this.props}
            className="Addon-install-button"
            defaultInstallSource={defaultInstallSource}
            size="small"
          />
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
