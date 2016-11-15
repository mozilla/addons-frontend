/* eslint-disable react/no-danger */

import classNames from 'classnames';
import { sprintf } from 'jed';
import React, { PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { sanitizeHTML } from 'core/utils';
import translate from 'core/i18n/translate';
import themeAction, { getThemeData } from 'disco/themePreview';
import tracking, { getAction } from 'core/tracking';
import InstallButton from 'core/components/InstallButton';
import {
  DISABLED,
  DOWNLOAD_FAILED,
  ERROR,
  EXTENSION_TYPE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  THEME_TYPE,
  UNINSTALLED,
  UNINSTALLING,
  validAddonTypes,
  validInstallStates,
} from 'core/constants';
import {
  CLICK_CATEGORY,
  INSTALL_CATEGORY,
} from 'disco/constants';
import { withInstallHelpers } from 'core/installAddon';

import 'disco/css/Addon.scss';

export class AddonBase extends React.Component {
  static propTypes = {
    description: PropTypes.string,
    error: PropTypes.string,
    guid: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
    iconUrl: PropTypes.string,
    installTheme: PropTypes.func.isRequired,
    needsRestart: PropTypes.bool.isRequired,
    previewURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    setCurrentStatus: PropTypes.func.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    themeAction: PropTypes.func,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
    _tracking: PropTypes.object,
  }

  static defaultProps = {
    // Defaults themeAction to the imported func.
    themeAction,
    needsRestart: false,
    _tracking: tracking,
  }

  componentDidMount() {
    this.props.setCurrentStatus();
  }

  getBrowserThemeData() {
    return JSON.stringify(getThemeData(this.props));
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
    if (this.props.type === EXTENSION_TYPE) {
      return <div className="logo"><img src={iconUrl} alt="" /></div>;
    }
    return null;
  }

  getThemeImage() {
    const { i18n, name, previewURL } = this.props;
    if (this.props.type === THEME_TYPE) {
      // eslint-disable-next-line jsx-a11y/href-no-hash
      return (<a href="#" className="theme-image"
                 data-browsertheme={this.getBrowserThemeData()}
                 onBlur={this.resetPreviewTheme}
                 onClick={this.clickInstallTheme}
                 onFocus={this.previewTheme}
                 onMouseOut={this.resetPreviewTheme}
                 onMouseOver={this.previewTheme}>
        <img src={previewURL}
          alt={sprintf(i18n.gettext('Hover to preview or click to install %(name)s'), { name })}
        /></a>);
    }
    return null;
  }

  getDescription() {
    const { i18n, description, type } = this.props;
    if (type === THEME_TYPE) {
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

  clickInstallTheme = (e) => {
    const { guid, installTheme, name, status, type } = this.props;
    e.preventDefault();
    if (type === THEME_TYPE && [UNINSTALLED, DISABLED].includes(status)) {
      installTheme(e.currentTarget, guid, name);
    }
  }

  previewTheme = (e) => {
    this.props.themeAction(e.currentTarget, THEME_PREVIEW);
  }

  resetPreviewTheme = (e) => {
    this.props.themeAction(e.currentTarget, THEME_RESET_PREVIEW);
  }

  render() {
    const { heading, type } = this.props;

    if (!validAddonTypes.includes(type)) {
      throw new Error(`Invalid addon type "${type}"`);
    }

    const addonClasses = classNames('addon', {
      theme: type === THEME_TYPE,
      extension: type === EXTENSION_TYPE,
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
          <div className="install-button">
            <InstallButton {...this.props} />
          </div>
        </div>
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps, { _tracking = tracking } = {}) {
  const installation = state.installations[ownProps.guid] || {};
  const addon = state.addons[ownProps.guid] || {};
  return {
    ...installation,
    ...addon,
    installTheme(node, guid, name, _themeAction = themeAction) {
      _themeAction(node, THEME_INSTALL);
      _tracking.sendEvent({ action: 'theme', category: INSTALL_CATEGORY, label: name });
    },
  };
}

export default compose(
  translate({ withRef: true }),
  withInstallHelpers,
  connect(mapStateToProps, undefined, undefined, { withRef: true }),
)(AddonBase);
