/* eslint-disable react/no-danger */

import classNames from 'classnames';
import { sprintf } from 'jed';
import React, { PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { sanitizeHTML } from 'core/utils';
import translate from 'core/i18n/translate';
import themeAction from 'core/themePreview';
import tracking, { getAction } from 'core/tracking';
import InstallButton from 'core/components/InstallButton';
import HoverIntent from 'core/components/HoverIntent';
import {
  CLICK_CATEGORY,
  DOWNLOAD_FAILED,
  ERROR,
  ADDON_TYPE_EXTENSION,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  ADDON_TYPE_THEME,
  UNINSTALLING,
  validAddonTypes,
  validInstallStates,
} from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';

import 'disco/css/Addon.scss';

export class AddonBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    description: PropTypes.string,
    error: PropTypes.string,
    heading: PropTypes.string.isRequired,
    getBrowserThemeData: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    iconUrl: PropTypes.string,
    installTheme: PropTypes.func.isRequired,
    needsRestart: PropTypes.bool.isRequired,
    previewTheme: PropTypes.func.isRequired,
    previewURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    resetPreviewTheme: PropTypes.func.isRequired,
    setCurrentStatus: PropTypes.func.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
    _tracking: PropTypes.object,
  }

  static defaultProps = {
    // Defaults themeAction to the imported func.
    themeAction,
    needsRestart: false,
    _tracking: tracking,
  }

  getError() {
    const { error, i18n, status } = this.props;
    return status === ERROR ? (<div className="notification error" key="error-overlay">
      <p className="message">{this.errorMessage()}</p>
      {error && !error.startsWith('FATAL') ?
        // eslint-disable-next-line jsx-a11y/href-no-hash
        <a className="close" href="#" onClick={this.closeError}>{i18n.gettext('Close')}</a> : null}
    </div>) : null;
  }

  getRestart() {
    return this.props.needsRestart ? (<div className="notification restart" key="restart-overlay">
      <p className="message">{this.restartMessage()}</p>
    </div>) : null;
  }

  getLogo() {
    const { iconUrl } = this.props;
    if (this.props.type === ADDON_TYPE_EXTENSION) {
      return <div className="logo"><img src={iconUrl} alt="" /></div>;
    }
    return null;
  }

  getThemeImage() {
    const { getBrowserThemeData, i18n, name, previewURL } = this.props;
    if (this.props.type === ADDON_TYPE_THEME) {
      /* eslint-disable jsx-a11y/href-no-hash */
      return (
        <HoverIntent
          onHoverIntent={this.previewTheme}
          onHoverIntentEnd={this.resetPreviewTheme}>
          <a href="#" className="theme-image"
            data-browsertheme={getBrowserThemeData()}
            onBlur={this.resetPreviewTheme}
            onClick={this.installTheme}
            onFocus={this.previewTheme}>
            <img src={previewURL}
              alt={sprintf(i18n.gettext('Hover to preview or click to install %(name)s'), { name })} />
          </a>
        </HoverIntent>
      );
      /* eslint-enable jsx-a11y/href-no-hash */
    }
    return null;
  }

  getDescription() {
    const { i18n, description, type } = this.props;
    if (type === ADDON_TYPE_THEME) {
      return (
        <p className="editorial-description">{i18n.gettext('Hover over the image to preview')}</p>
      );
    }
    return (
      <div
        ref={(ref) => { this.editorialDescription = ref; }}
        className="editorial-description"
        dangerouslySetInnerHTML={sanitizeHTML(description, ['blockquote', 'cite'])} />
    );
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, installTheme } = this.props;
    installTheme(event.currentTarget, addon);
  }

  errorMessage() {
    const { error, i18n } = this.props;
    switch (error) {
      case INSTALL_FAILED:
        return i18n.gettext('Installation failed. Please try again.');
      case DOWNLOAD_FAILED:
        return i18n.gettext('Download failed. Please check your connection.');
      case FATAL_INSTALL_ERROR:
        return i18n.gettext('An unexpected error occurred during installation.');
      case FATAL_UNINSTALL_ERROR:
        return i18n.gettext('An unexpected error occurred during uninstallation.');
      case FATAL_ERROR:
      default:
        return i18n.gettext('An unexpected error occurred.');
    }
  }

  restartMessage() {
    const { status, i18n } = this.props;
    switch (status) {
      case UNINSTALLING:
        return i18n.gettext('This add-on will be uninstalled after you restart Firefox.');
      default:
        return i18n.gettext('Please restart Firefox to use this add-on.');
    }
  }

  closeError = (e) => {
    e.preventDefault();
    this.props.setCurrentStatus();
  }

  clickHeadingLink = (e) => {
    const { type, name, _tracking } = this.props;

    if (e.target.nodeName.toLowerCase() === 'a') {
      _tracking.sendEvent({
        action: getAction(type),
        category: CLICK_CATEGORY,
        label: name,
      });
    }
  }

  previewTheme = (e) => {
    this.props.previewTheme(e.currentTarget);
  }

  resetPreviewTheme = (e) => {
    this.props.resetPreviewTheme(e.currentTarget);
  }

  render() {
    const { heading, type } = this.props;

    if (!validAddonTypes.includes(type)) {
      throw new Error(`Invalid addon type "${type}"`);
    }

    const addonClasses = classNames('addon', {
      theme: type === ADDON_TYPE_THEME,
      extension: type === ADDON_TYPE_EXTENSION,
    });

    return (
      <div className={addonClasses}>
        {this.getThemeImage()}
        {this.getLogo()}
        <div className="content">
          <ReactCSSTransitionGroup
            transitionName="overlay"
            transitionEnterTimeout={700}
            transitionLeaveTimeout={300}
          >
            {this.getError()}
            {this.getRestart()}
          </ReactCSSTransitionGroup>
          <div className="copy">
            <h2
              onClick={this.clickHeadingLink}
              ref={(ref) => { this.heading = ref; }}
              className="heading"
              dangerouslySetInnerHTML={sanitizeHTML(heading, ['a', 'span'])} />
            {this.getDescription()}
          </div>
          <InstallButton className="Addon-install-button" size="small" {...this.props} />
        </div>
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  const installation = state.installations[ownProps.guid] || {};
  const addon = state.addons[ownProps.guid] || {};
  return {
    addon,
    ...addon,
    ...installation,
  };
}

export default compose(
  translate({ withRef: true }),
  connect(mapStateToProps, undefined, undefined, { withRef: true }),
  withInstallHelpers({ src: 'discovery-promo' }),
)(AddonBase);
