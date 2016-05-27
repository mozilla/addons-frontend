import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import translate from 'core/i18n/translate';

import config from 'config';
import { AddonManager } from 'disco/addonManager';
import {
  DOWNLOADING,
  INSTALLED,
  THEME_INSTALL,
  THEME_TYPE,
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
    guid: PropTypes.string,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    installURL: PropTypes.string,
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
    const { guid, installURL, setInitialStatus, slug } = this.props;
    setInitialStatus({guid, installURL, slug});
  }

  handleClick = () => {
    const { guid, install, installURL, slug, status, installTheme, type, uninstall } = this.props;
    if (type === THEME_TYPE && status === UNINSTALLED) {
      installTheme(this.refs.themeData, slug);
    } else if (status === UNINSTALLED) {
      install({ guid, installURL, slug });
    } else if (status === INSTALLED) {
      uninstall({ guid, installURL, slug });
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
  const installation = state.installations[ownProps.slug] || {};
  const addon = state.addons[ownProps.slug] || {};
  return {...installation, ...addon};
}

export function makeProgressHandler(dispatch, slug) {
  return (addonInstall) => {
    if (addonInstall.state === 'STATE_DOWNLOADING') {
      const downloadProgress = parseInt(
        100 * addonInstall.progress / addonInstall.maxProgress, 10);
      dispatch({type: 'DOWNLOAD_PROGRESS', payload: {slug, downloadProgress}});
    } else if (addonInstall.state === 'STATE_INSTALLING') {
      dispatch({type: 'START_INSTALL', payload: {slug}});
    } else if (addonInstall.state === 'STATE_INSTALLED') {
      dispatch({type: 'INSTALL_COMPLETE', payload: {slug}});
    }
  };
}

export function mapDispatchToProps(dispatch) {
  if (config.get('server')) {
    return {};
  }
  return {
    setInitialStatus({ guid, installURL, slug }) {
      const addonManager = new AddonManager(guid, installURL);
      const payload = {guid, slug, url: installURL};
      return addonManager.getAddon()
        .then(
          (addon) => {
            const status = addon.type === THEME_TYPE && !addon.isEnabled ? UNINSTALLED : INSTALLED;
            dispatch({type: 'INSTALL_STATE', payload: {...payload, status}});
          },
          () => dispatch({type: 'INSTALL_STATE', payload: {...payload, status: UNINSTALLED}}));
    },

    install({ guid, installURL, slug }) {
      const addonManager = new AddonManager(guid, installURL, makeProgressHandler(dispatch, slug));
      dispatch({type: 'START_DOWNLOAD', payload: {slug}});
      return addonManager.install();
    },

    installTheme(node, slug, _themeAction = themeAction) {
      _themeAction(node, THEME_INSTALL);
      return new Promise((resolve) => {
        setTimeout(() => {
          dispatch({type: 'INSTALL_STATE', payload: {slug, status: INSTALLED}});
          resolve();
        }, 250);
      });
    },

    uninstall({ guid, installURL, slug }) {
      const addonManager = new AddonManager(guid, installURL);
      dispatch({type: 'START_UNINSTALL', payload: {slug}});
      return addonManager.uninstall()
        .then(() => dispatch({type: 'UNINSTALL_COMPLETE', payload: {slug}}));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(translate()(InstallButton));
