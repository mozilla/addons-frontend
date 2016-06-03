import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';

import config from 'config';
import { AddonManager } from 'disco/addonManager';
import {
  DOWNLOADING,
  EXTENSION_TYPE,
  INSTALLED,
  INSTALL_CATEGORY,
  THEME_INSTALL,
  THEME_TYPE,
  UNINSTALL_CATEGORY,
  UNINSTALLED,
  UNKNOWN,
  validAddonTypes,
  validInstallStates as validStates,
} from 'disco/constants';
import themeAction, { getThemeData } from 'disco/themePreview';

import 'disco/css/InstallButton.scss';

export class InstallButton extends React.Component {
  static propTypes = {
    handleChange: PropTypes.func,
    guid: PropTypes.string.isRequired,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    installURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    uninstall: PropTypes.func.isRequired,
    url: PropTypes.string,
    downloadProgress: PropTypes.number,
    setInitialStatus: PropTypes.func.isRequired,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validStates),
    type: PropTypes.oneOf(validAddonTypes),
  }

  static defaultProps = {
    status: UNKNOWN,
    downloadProgress: 0,
  }

  componentDidMount() {
    const { guid, installURL, setInitialStatus } = this.props;
    setInitialStatus({guid, installURL});
  }

  handleClick = (e) => {
    e.preventDefault();
    const { guid, install, installURL, name, status, installTheme, type, uninstall } = this.props;
    if (type === THEME_TYPE && status === UNINSTALLED) {
      installTheme(this.refs.themeData, guid, name);
    } else if (status === UNINSTALLED) {
      install({ guid, installURL, name });
    } else if (status === INSTALLED) {
      uninstall({ guid, installURL, name, type });
    }
  }

  render() {
    const { downloadProgress, i18n, slug, status } = this.props;

    if (!validStates.includes(status)) {
      throw new Error('Invalid add-on status');
    }

    const isInstalled = status === INSTALLED;
    const isDisabled = status === UNKNOWN;
    const isDownloading = status === DOWNLOADING;
    const switchClasses = `switch ${status}`;
    const identifier = `install-button-${slug}`;

    return (
      <div className={switchClasses} onClick={this.handleClick}
        data-download-progress={isDownloading ? downloadProgress : 0}>
        <input
          id={identifier}
          className="visually-hidden"
          checked={isInstalled}
          disabled={isDisabled}
          onChange={this.props.handleChange}
          data-browsertheme={JSON.stringify(getThemeData(this.props))}
          ref="themeData"
          type="checkbox" />
        <label htmlFor={identifier}>
          {isDownloading ? <div className="progress"></div> : null}
          <span className="visually-hidden">{i18n.gettext('Install')}</span>
        </label>
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

export default connect(mapStateToProps, mapDispatchToProps)(translate()(InstallButton));
