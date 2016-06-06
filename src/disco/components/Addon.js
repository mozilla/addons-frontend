import classNames from 'classnames';
import { sprintf } from 'jed';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import translate from 'core/i18n/translate';
import purify from 'core/purify';

import config from 'config';
import themeAction, { getThemeData } from 'disco/themePreview';
import tracking from 'core/tracking';
import { AddonManager } from 'disco/addonManager';

import InstallButton from 'disco/components/InstallButton';
import {
  validAddonTypes,
  validInstallStates,
  ERROR,
  EXTENSION_TYPE,
  INSTALL_CATEGORY,
  INSTALLED,
  THEME_INSTALL,
  THEME_TYPE,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  UNINSTALL_CATEGORY,
  UNINSTALLED,
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
    closeErrorAction: PropTypes.func,
    description: PropTypes.string,
    editorialDescription: PropTypes.string.isRequired,
    errorMessage: PropTypes.string,
    footerURL: PropTypes.string,
    guid: PropTypes.string.isRequired,
    headerURL: PropTypes.string,
    heading: PropTypes.string.isRequired,
    i18n: PropTypes.string.isRequired,
    iconUrl: PropTypes.string,
    id: PropTypes.string.isRequired,
    installURL: PropTypes.string,
    previewURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    setInitialStatus: PropTypes.func.isRequired,
    status: PropTypes.oneOf(validInstallStates).isRequired,
    textcolor: PropTypes.string,
    themeAction: PropTypes.func,
    type: PropTypes.oneOf(validAddonTypes).isRequired,
  }

  static defaultProps = {
    // Defaults themeAction to the imported func.
    themeAction,
  }

  componentDidMount() {
    const { guid, installURL, setInitialStatus } = this.props;
    setInitialStatus({guid, installURL});
  }

  getBrowserThemeData() {
    return JSON.stringify(getThemeData(this.props));
  }

  getError() {
    const { status, i18n } = this.props;
    const errorMessage = this.props.errorMessage || i18n.gettext('An unexpected error occurred');
    return status === ERROR ? (<div className="error">
      <p className="message">{errorMessage}</p>
      <a className="close" href="#" onClick={this.props.closeErrorAction}>Close</a>
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
          {this.getError()}
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

export function mapStateToProps(state, ownProps) {
  const installation = state.installations[ownProps.guid] || {};
  const addon = state.addons[ownProps.guid] || {};
  return {...installation, ...addon};
}

export function makeProgressHandler(dispatch, guid) {
  return (addonInstall) => {
    if (addonInstall.state === 'STATE_DOWNLOADING') {
      const downloadProgress = parseInt(
        100 * addonInstall.progress / addonInstall.maxProgress, 10);
      dispatch({type: 'DOWNLOAD_PROGRESS', payload: {guid, downloadProgress}});
    } else if (addonInstall.state === 'STATE_INSTALLING') {
      dispatch({type: 'START_INSTALL', payload: {guid}});
    } else if (addonInstall.state === 'STATE_INSTALLED') {
      dispatch({type: 'INSTALL_COMPLETE', payload: {guid}});
    }
  };
}

export function mapDispatchToProps(dispatch, { _tracking = tracking } = {}) {
  if (config.get('server')) {
    return {};
  }
  return {
    setInitialStatus({ guid, installURL }) {
      const addonManager = new AddonManager(guid, installURL);
      const payload = {guid, url: installURL};
      return addonManager.getAddon()
        .then(
          (addon) => {
            const status = addon.type === THEME_TYPE && !addon.isEnabled ? UNINSTALLED : INSTALLED;
            dispatch({type: 'INSTALL_STATE', payload: {...payload, status}});
          },
          () => dispatch({type: 'INSTALL_STATE', payload: {...payload, status: UNINSTALLED}}));
    },

    install({ guid, installURL, name }) {
      const addonManager = new AddonManager(guid, installURL, makeProgressHandler(dispatch, guid));
      dispatch({type: 'START_DOWNLOAD', payload: {guid}});
      _tracking.sendEvent({action: 'addon', category: INSTALL_CATEGORY, label: name});
      return addonManager.install();
    },

    installTheme(node, guid, name, _themeAction = themeAction) {
      _themeAction(node, THEME_INSTALL);
      _tracking.sendEvent({action: 'theme', category: INSTALL_CATEGORY, label: name});
      return new Promise((resolve) => {
        setTimeout(() => {
          dispatch({type: 'INSTALL_STATE', payload: {guid, status: INSTALLED}});
          resolve();
        }, 250);
      });
    },

    uninstall({ guid, installURL, name, type }) {
      const addonManager = new AddonManager(guid, installURL);
      dispatch({type: 'START_UNINSTALL', payload: {guid}});
      const action = {
        [EXTENSION_TYPE]: 'addon',
        [THEME_TYPE]: 'theme',
      }[type] || 'invalid';
      _tracking.sendEvent({action, category: UNINSTALL_CATEGORY, label: name});
      return addonManager.uninstall()
        .then(() => dispatch({type: 'UNINSTALL_COMPLETE', payload: {guid}}));
    },
  };
}

export default connect(
  mapStateToProps, mapDispatchToProps, undefined, {withRef: true}
)(translate({withRef: true})(Addon));
