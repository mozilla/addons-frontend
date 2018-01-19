import url from 'url';

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { oneLine } from 'common-tags';
import config from 'config';

import { setInstallState } from 'core/actions/installations';
import log from 'core/logger';
import themeAction, { getThemeData } from 'core/themePreview';
import tracking, { getAction } from 'core/tracking';
import {
  CLOSE_INFO,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_CATEGORY,
  INSTALL_ERROR,
  INSTALL_CANCELLED,
  INSTALL_FAILED,
  INSTALL_STARTED_CATEGORY,
  INSTALLING,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
  SET_ENABLE_NOT_AVAILABLE,
  SHOW_INFO,
  START_DOWNLOAD,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_THEME,
  ADDON_TYPE_THEME,
  UNINSTALL_CATEGORY,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import * as addonManager from 'core/addonManager';
import {
  USER_AGENT_OS_ANDROID,
  USER_AGENT_OS_BSD_DRAGONFLY,
  USER_AGENT_OS_BSD_FREEBSD,
  USER_AGENT_OS_BSD_NETBSD,
  USER_AGENT_OS_BSD_OPENBSD,
  USER_AGENT_OS_BSD_PC,
  USER_AGENT_OS_LINUX,
  USER_AGENT_OS_LINUX_ARCH,
  USER_AGENT_OS_LINUX_CENTOS,
  USER_AGENT_OS_LINUX_DEBIAN,
  USER_AGENT_OS_LINUX_FEDORA,
  USER_AGENT_OS_LINUX_GENTOO,
  USER_AGENT_OS_LINUX_GNU,
  USER_AGENT_OS_LINUX_LINPUS,
  USER_AGENT_OS_LINUX_PC,
  USER_AGENT_OS_LINUX_REDHAT,
  USER_AGENT_OS_LINUX_SLACKWARE,
  USER_AGENT_OS_LINUX_SUSE,
  USER_AGENT_OS_LINUX_UBUNTU,
  USER_AGENT_OS_LINUX_VECTOR,
  USER_AGENT_OS_LINUX_ZENWALK,
  USER_AGENT_OS_MAC,
  USER_AGENT_OS_UNIX,
  USER_AGENT_OS_WINDOWS,
} from 'core/reducers/api';


export function installTheme(
  node, addon, { _themeAction = themeAction, _tracking = tracking } = {},
) {
  const { name, status, type } = addon;
  if (
    type === ADDON_TYPE_THEME &&
    [DISABLED, UNINSTALLED, UNKNOWN].includes(status)
  ) {
    _themeAction(node, THEME_INSTALL);
    // For consistency, track both a start-install and an install event.
    _tracking.sendEvent({
      action: TRACKING_TYPE_THEME,
      category: INSTALL_STARTED_CATEGORY,
      label: name,
    });
    _tracking.sendEvent({
      action: TRACKING_TYPE_THEME,
      category: INSTALL_CATEGORY,
      label: name,
    });
  }
}

export function makeProgressHandler(dispatch, guid) {
  return (addonInstall, event) => {
    if (addonInstall.state === 'STATE_DOWNLOADING') {
      const downloadProgress = parseInt(
        (100 * addonInstall.progress) / addonInstall.maxProgress, 10);
      dispatch({
        type: DOWNLOAD_PROGRESS,
        payload: { guid, downloadProgress },
      });
    } else if (event.type === 'onDownloadEnded') {
      dispatch(setInstallState({ guid, status: INSTALLING }));
    } else if (event.type === 'onDownloadFailed') {
      dispatch({
        type: INSTALL_ERROR,
        payload: { guid, error: DOWNLOAD_FAILED },
      });
    } else if (event.type === 'onInstallCancelled') {
      dispatch({
        type: INSTALL_CANCELLED,
        payload: { guid },
      });
    } else if (event.type === 'onInstallFailed') {
      dispatch({
        type: INSTALL_ERROR,
        payload: { guid, error: INSTALL_FAILED },
      });
    }
  };
}

export function getGuid(ownProps) {
  // Returns guid directly on ownProps or if ownProps
  // has an addons object return the guid from there.
  return ownProps.guid || (ownProps.addon && ownProps.addon.guid);
}

export function mapStateToProps(state, ownProps) {
  const guid = getGuid(ownProps);
  const addon = state.installations[guid] || {};

  return {
    isPreviewingTheme: addon.isPreviewingTheme,
    themePreviewNode: addon.isPreviewingTheme ? addon.themePreviewNode : null,
    getBrowserThemeData() {
      return JSON.stringify(getThemeData(ownProps));
    },
    toggleThemePreview(node, _themeAction = themeAction, _log = log) {
      const theme = addon && addon.guid ? addon : null;
      if (theme && theme.status !== ENABLED) {
        if (!theme.isPreviewingTheme) {
          _log.info(`Previewing theme: ${guid}`);
          // Call WithInstallHelpers.previewTheme().
          this.previewTheme(node, _themeAction);
        } else {
          _log.info(`Resetting theme preview: ${guid}`);
          // Call WithInstallHelpers.resetThemePreview().
          this.resetThemePreview(node, _themeAction);
        }
      }
      if (!theme) {
        _log.info(`Theme ${guid} could not be found`);
      }
      if (theme && theme.status === ENABLED) {
        _log.info(
          `Theme ${guid} is already enabled! Previewing is not necessary.`);
      }
    },
  };
}

export function makeMapDispatchToProps({ WrappedComponent, src }) {
  return function mapDispatchToProps(dispatch, ownProps) {
    const mappedProps = { dispatch, src, WrappedComponent };

    if (config.get('server')) {
      // Return early without validating properties.
      // I think this returns early because a user agent prop isn't
      // guaranteed on the server.
      return mappedProps;
    }

    if (ownProps.installURLs === undefined) {
      throw new Error(oneLine`installURLs is required, ensure component
        props are set before withInstallHelpers is called`);
    }

    if (ownProps.userAgentInfo === undefined) {
      throw new Error(oneLine`userAgentInfo is required, ensure component
        props are set before withInstallHelpers is called`);
    }

    return mappedProps;
  };
}

const userAgentOSToPlatform = {
  [USER_AGENT_OS_ANDROID.toLowerCase()]: OS_ANDROID,
  [USER_AGENT_OS_MAC.toLowerCase()]: OS_MAC,
  [USER_AGENT_OS_WINDOWS.toLowerCase()]: OS_WINDOWS,
  // Not all of these are strictly Linux but giving them a Linux XPI
  // will probably work 99% of the time.
  [USER_AGENT_OS_BSD_DRAGONFLY.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_BSD_FREEBSD.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_BSD_NETBSD.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_BSD_OPENBSD.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_BSD_PC.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_ARCH.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_CENTOS.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_DEBIAN.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_FEDORA.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_GENTOO.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_GNU.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_LINPUS.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_PC.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_REDHAT.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_SLACKWARE.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_SUSE.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_UBUNTU.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_VECTOR.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_LINUX_ZENWALK.toLowerCase()]: OS_LINUX,
  [USER_AGENT_OS_UNIX.toLowerCase()]: OS_LINUX,
};

/*
 * This is a helper to find the correct install URL for the
 * user agent's platform.
 *
 * Parameter types:
 *
 * import type { AddonType } from 'src/core/types/addons';
 * import type { UserAgentInfoType } from 'src/core/reducers/api';
 *
 * type FindInstallUrlParams = {|
 *   installURLs: $PropertyType<AddonType, 'installURLs'>,
 *   src?: string,
 *   userAgentInfo: UserAgentInfoType,
 * |};
 *
 */
export const findInstallURL = ({ installURLs, userAgentInfo, src }) => {
  if (!installURLs) {
    throw new Error('The installURLs parameter is required');
  }
  if (!userAgentInfo) {
    throw new Error('The userAgentInfo parameter is required');
  }

  const agentOsName =
    userAgentInfo.os.name && userAgentInfo.os.name.toLowerCase();
  const platform = userAgentOSToPlatform[agentOsName];
  const platformURL = installURLs[platform];

  let installURL;
  if (platformURL) {
    installURL = platformURL;
  }

  if (!installURL) {
    installURL = installURLs[OS_ALL];
  }

  if (!installURL) {
    // This could happen for themes which do not have version files.
    log.debug(oneLine`No install URL exists for platform "${agentOsName}"
      (mapped to "${platform}"); install URLs:`, installURLs);
    return undefined;
  }

  if (!src) {
    return installURL;
  }

  // Add ?src=...
  const parseQuery = true;
  const urlParts = url.parse(installURL, parseQuery);
  return url.format({
    ...urlParts,
    // Reset the search string so we can define a new one.
    search: undefined,
    query: { ...urlParts.query, src },
  });
};

export class WithInstallHelpers extends React.Component {
  static propTypes = {
    WrappedComponent: PropTypes.func.isRequired,
    _addonManager: PropTypes.object,
    _tracking: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    guid: PropTypes.string,
    iconUrl: PropTypes.string,
    hasAddonManager: PropTypes.bool,
    installTheme: PropTypes.func,
    installURLs: PropTypes.string,
    name: PropTypes.string.isRequired,
    src: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  }

  static defaultProps = {
    _addonManager: addonManager,
    _tracking: tracking,
    hasAddonManager: addonManager.hasAddonManager(),
    installTheme,
  }

  componentDidMount() {
    this.setCurrentStatus(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const { guid: oldGuid } = this.props;
    const { guid: newGuid } = nextProps;
    if (newGuid && newGuid !== oldGuid) {
      log.info('Updating add-on status');
      this.setCurrentStatus({ ...this.props, ...nextProps });
    }
  }

  setCurrentStatus(newProps = this.props) {
    const {
      _addonManager,
      dispatch,
      hasAddonManager,
      installURLs,
      userAgentInfo,
    } = this.props;
    const installURL = findInstallURL({ installURLs, userAgentInfo });
    if (!hasAddonManager) {
      log.info('No addon manager, cannot set add-on status');
      return Promise.resolve();
    }

    const guid = getGuid(newProps);
    const payload = { guid, url: installURL };

    log.info('Setting add-on status');
    return _addonManager.getAddon(guid)
      .then((addon) => {
        const status = addon.isActive && addon.isEnabled ?
          ENABLED : DISABLED;

        dispatch(setInstallState({ ...payload, status }));
      }, (error) => {
        log.info(
          oneLine`Add-on "${guid}" not found so setting status to
          UNINSTALLED; exact error: ${error}`);
        dispatch(setInstallState({ ...payload, status: UNINSTALLED }));
      })
      .catch((error) => {
        log.error(`Caught error from addonManager: ${error}`);
        // Dispatch a generic error should the success/error functions
        // throw.
        dispatch(setInstallState({
          guid, status: ERROR, error: FATAL_ERROR,
        }));
      });
  }

  enable({ _showInfo = this.showInfo } = {}) {
    const { _addonManager, dispatch, guid, iconUrl, name } = this.props;
    return _addonManager.enable(guid)
      .then(() => {
        if (!_addonManager.hasPermissionPromptsEnabled()) {
          _showInfo({ name, iconUrl });
        }
      })
      .catch((err) => {
        if (err && err.message === SET_ENABLE_NOT_AVAILABLE) {
          log.info(
            `addon.setEnabled not available. Unable to enable ${guid}`);
        } else {
          log.error(err);
          dispatch(setInstallState({
            guid, status: ERROR, error: FATAL_ERROR,
          }));
        }
      });
  }

  install() {
    const {
      _addonManager,
      _tracking,
      dispatch,
      guid,
      iconUrl,
      installURLs,
      name,
      src,
      userAgentInfo,
    } = this.props;

    dispatch({ type: START_DOWNLOAD, payload: { guid } });
    _tracking.sendEvent({
      action: TRACKING_TYPE_EXTENSION,
      category: INSTALL_STARTED_CATEGORY,
      label: name,
    });

    const installURL = findInstallURL({ installURLs, userAgentInfo });
    return _addonManager.install(
      installURL, makeProgressHandler(dispatch, guid), { src }
    )
      .then(() => {
        _tracking.sendEvent({
          action: TRACKING_TYPE_EXTENSION,
          category: INSTALL_CATEGORY,
          label: name,
        });
        if (!_addonManager.hasPermissionPromptsEnabled()) {
          this.showInfo({ name, iconUrl });
        }
      })
      .catch((error) => {
        log.error(`Install error: ${error}`);
        dispatch(setInstallState({
          guid, status: ERROR, error: FATAL_INSTALL_ERROR,
        }));
      });
  }

  showInfo({ name, iconUrl }) {
    const { dispatch } = this.props;
    dispatch({
      type: SHOW_INFO,
      payload: {
        addonName: name,
        imageURL: iconUrl,
        closeAction: () => {
          dispatch({ type: CLOSE_INFO });
        },
      },
    });
  }

  previewTheme(node, _themeAction = themeAction) {
    const guid = getGuid(this.props);
    _themeAction(node, THEME_PREVIEW);
    this.props.dispatch({
      type: THEME_PREVIEW,
      payload: {
        guid,
        themePreviewNode: node,
      },
    });
  }

  resetThemePreview(node, _themeAction = themeAction) {
    const guid = getGuid(this.props);
    _themeAction(node, THEME_RESET_PREVIEW);
    this.props.dispatch({
      type: THEME_RESET_PREVIEW,
      payload: {
        guid,
      },
    });
  }

  uninstall({ guid, name, type }) {
    const { _addonManager, _tracking, dispatch } = this.props;
    dispatch(setInstallState({ guid, status: UNINSTALLING }));

    const action = getAction(type);
    return _addonManager.uninstall(guid)
      .then(() => {
        _tracking.sendEvent({
          action,
          category: UNINSTALL_CATEGORY,
          label: name,
        });
      })
      .catch((err) => {
        log.error(err);
        dispatch(setInstallState({
          guid, status: ERROR, error: FATAL_UNINSTALL_ERROR,
        }));
      });
  }

  render() {
    const { WrappedComponent, ...props } = this.props;

    // Wrapped components will receive these prop functions.
    const exposedPropHelpers = {
      enable: (...args) => this.enable(...args),
      install: (...args) => this.install(...args),
      previewTheme: (...args) => this.previewTheme(...args),
      resetThemePreview: (...args) => this.resetThemePreview(...args),
      setCurrentStatus: (...args) => this.setCurrentStatus(...args),
      uninstall: (...args) => this.uninstall(...args),
    };

    return <WrappedComponent {...exposedPropHelpers} {...props} />;
  }
}

export function withInstallHelpers({
  _makeMapDispatchToProps = makeMapDispatchToProps, src,
}) {
  if (!src) {
    throw new Error('src is required for withInstallHelpers');
  }
  return (WrappedComponent) => compose(
    connect(
      mapStateToProps, _makeMapDispatchToProps({ WrappedComponent, src })
    ),
  )(WithInstallHelpers);
}
