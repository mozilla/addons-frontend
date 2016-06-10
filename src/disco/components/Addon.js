import classNames from 'classnames';
import { sprintf } from 'jed';
import React, { PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { connect } from 'react-redux';
import translate from 'core/i18n/translate';
import purify from 'core/purify';

import config from 'config';
import themeAction, { getThemeData } from 'disco/themePreview';
import tracking from 'core/tracking';
import * as addonManager from 'disco/addonManager';
import log from 'core/logger';

import InstallButton from 'disco/components/InstallButton';
import {
  validAddonTypes,
  validInstallStates,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  EXTENSION_TYPE,
  INSTALL_CATEGORY,
  INSTALL_ERROR,
  INSTALL_FAILED,
  INSTALL_STATE,
  START_DOWNLOAD,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  THEME_TYPE,
  UNINSTALLING,
  UNINSTALLED,
  UNINSTALL_CATEGORY,
} from 'disco/constants';

import 'disco/css/Addon.scss';

function sanitizeHTML(text, allowTags = []) {
  // TODO: Accept tags to allow and run through dom-purify.
  return {
    __html: purify.sanitize(text, {ALLOWED_TAGS: allowTags}),
  };
}

export class Addon extends React.Component {
  static propTypes = {
    accentcolor: PropTypes.string,
    description: PropTypes.string,
    editorialDescription: PropTypes.string.isRequired,
    error: PropTypes.string,
    footerURL: PropTypes.string,
    guid: PropTypes.string.isRequired,
    headerURL: PropTypes.string,
    heading: PropTypes.string.isRequired,
    i18n: PropTypes.object.isRequired,
    iconUrl: PropTypes.string,
    id: PropTypes.string.isRequired,
    installURL: PropTypes.string,
    needsRestart: PropTypes.bool.isRequired,
    previewURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    setCurrentStatus: PropTypes.func.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    textcolor: PropTypes.string,
    themeAction: PropTypes.func,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
  }

  static defaultProps = {
    // Defaults themeAction to the imported func.
    themeAction,
    needsRestart: false,
  }

  componentDidMount() {
    this.setCurrentStatus();
  }

  setCurrentStatus() {
    const { guid, installURL, setCurrentStatus } = this.props;
    setCurrentStatus({guid, installURL});
  }

  getBrowserThemeData() {
    return JSON.stringify(getThemeData(this.props));
  }

  getError() {
    return this.props.status === ERROR ? (<div className="notification error" key="error-overlay">
      <p className="message">{this.errorMessage()}</p>
      <a className="close" href="#" onClick={this.closeError}>Close</a>
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
      return (<a href="#" className="theme-image"
                 data-browsertheme={this.getBrowserThemeData()}
                 onBlur={this.resetPreviewTheme}
                 onClick={this.handleClick}
                 onFocus={this.previewTheme}
                 onMouseOut={this.resetPreviewTheme}
                 onMouseOver={this.previewTheme}>
        <img src={previewURL} alt={sprintf(i18n.gettext('Preview %(name)s'), {name})} /></a>);
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
        ref="editorialDescription"
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
    this.setCurrentStatus();
  }

  handleClick = (e) => {
    e.preventDefault();
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
              ref="heading"
              className="heading"
              dangerouslySetInnerHTML={sanitizeHTML(heading, ['span'])} />
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
      _tracking.sendEvent({action: 'theme', category: INSTALL_CATEGORY, label: name});
    },
  };
}

export function makeProgressHandler(dispatch, guid) {
  return (addonInstall, e) => {
    if (addonInstall.state === 'STATE_DOWNLOADING') {
      const downloadProgress = parseInt(
        100 * addonInstall.progress / addonInstall.maxProgress, 10);
      dispatch({type: DOWNLOAD_PROGRESS, payload: {guid, downloadProgress}});
    } else if (e.type === 'onDownloadFailed') {
      dispatch({type: INSTALL_ERROR, payload: {guid, error: DOWNLOAD_FAILED}});
    } else if (e.type === 'onInstallFailed') {
      dispatch({type: INSTALL_ERROR, payload: {guid, error: INSTALL_FAILED}});
    }
  };
}

export function mapDispatchToProps(dispatch, { _tracking = tracking,
                                               _addonManager = addonManager } = {}) {
  if (config.get('server')) {
    return {};
  }
  return {
    setCurrentStatus({ guid, installURL }) {
      const payload = {guid, url: installURL};
      return _addonManager.getAddon(guid)
        .then(
          (addon) => {
            const status = addon.isActive && addon.isEnabled ? ENABLED : DISABLED;
            dispatch({type: INSTALL_STATE, payload: {...payload, status}});
          },
          () => {
            log.info('Add-on not found so setting status to UNINSTALLED');
            dispatch({type: INSTALL_STATE, payload: {...payload, status: UNINSTALLED}});
          });
    },

    install({ guid, installURL, name }) {
      dispatch({type: START_DOWNLOAD, payload: {guid}});
      _tracking.sendEvent({action: 'addon', category: INSTALL_CATEGORY, label: name});
      return _addonManager.install(installURL, makeProgressHandler(dispatch, guid));
    },

    uninstall({ guid, name, type }) {
      const action = {
        [EXTENSION_TYPE]: 'addon',
        [THEME_TYPE]: 'theme',
      }[type] || 'invalid';
      _tracking.sendEvent({action, category: UNINSTALL_CATEGORY, label: name});
      return _addonManager.uninstall(guid);
    },
  };
}

export default connect(
  mapStateToProps, mapDispatchToProps, undefined, {withRef: true}
)(translate({withRef: true})(Addon));
