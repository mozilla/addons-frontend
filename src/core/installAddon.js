/* global CustomEvent, document, window */
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { oneLine } from 'common-tags';
import config from 'config';

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
  INSTALL_STATE,
  SET_ENABLE_NOT_AVAILABLE,
  SHOW_INFO,
  START_DOWNLOAD,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_THEME,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  UNINSTALL_CATEGORY,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'core/constants';
import * as addonManager from 'core/addonManager';


export function installTheme(
  node, addon, { _themeAction = themeAction, _tracking = tracking } = {},
) {
  const { name, status, type } = addon;
  if (
    type === ADDON_TYPE_THEME &&
    [DISABLED, UNINSTALLED, UNKNOWN].includes(status)
  ) {
    _themeAction(node, THEME_INSTALL);
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
          this.previewTheme(node, _themeAction);
        } else {
          _log.info(`Resetting theme preview: ${guid}`);
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
  return function mapDispatchToProps(
    dispatch,
    {
      _addonManager = addonManager,
      _tracking = tracking,
      ...ownProps
    } = {},
  ) {
    if (config.get('server')) {
      return { WrappedComponent };
    }

    if (
      ownProps.type === ADDON_TYPE_EXTENSION &&
      ownProps.installURL === undefined
    ) {
      throw new Error(oneLine`installURL is required, ensure component props
        are set before withInstallHelpers is called`);
    }

    function showInfo({ name, iconUrl }) {
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

    return {
      WrappedComponent,
      previewTheme(node, _themeAction = themeAction) {
        const guid = getGuid(ownProps);
        _themeAction(node, THEME_PREVIEW);
        dispatch({
          type: THEME_PREVIEW,
          payload: {
            guid,
            themePreviewNode: node,
          },
        });
      },
      resetThemePreview(node, _themeAction = themeAction) {
        const guid = getGuid(ownProps);
        _themeAction(node, THEME_RESET_PREVIEW);
        dispatch({
          type: THEME_RESET_PREVIEW,
          payload: {
            guid,
          },
        });
      },
      setCurrentStatus() {
        const { installURL } = ownProps;
        const guid = getGuid(ownProps);
        const payload = { guid, url: installURL };

        return _addonManager.getAddon(guid)
          .then((addon) => {
            const status = addon.isActive && addon.isEnabled ?
              ENABLED : DISABLED;

            dispatch({
              type: INSTALL_STATE,
              payload: { ...payload, status },
            });
          }, () => {
            log.info(
              `Add-on "${guid}" not found so setting status to UNINSTALLED`);
            dispatch({
              type: INSTALL_STATE,
              payload: { ...payload, status: UNINSTALLED },
            });
          })
          .catch((err) => {
            log.error(err);
            // Dispatch a generic error should the success/error functions
            // throw.
            dispatch({
              type: INSTALL_STATE,
              payload: { guid, status: ERROR, error: FATAL_ERROR },
            });
          });
      },

      enable({ _showInfo = showInfo } = {}) {
        const { guid, iconUrl, name } = ownProps;
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
              dispatch({
                type: INSTALL_STATE,
                payload: { guid, status: ERROR, error: FATAL_ERROR },
              });
            }
          });
      },

      install() {
        const { guid, iconUrl, installURL, name } = ownProps;
        dispatch({ type: START_DOWNLOAD, payload: { guid } });
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
              showInfo({ name, iconUrl });
            }
          })
          .catch((err) => {
            log.error(err);
            dispatch({
              type: INSTALL_STATE,
              payload: { guid, status: ERROR, error: FATAL_INSTALL_ERROR },
            });
          });
      },

      uninstall({ guid, name, type }) {
        dispatch({
          type: INSTALL_STATE,
          payload: { guid, status: UNINSTALLING },
        });

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
            dispatch({
              type: INSTALL_STATE,
              payload: { guid, status: ERROR, error: FATAL_UNINSTALL_ERROR },
            });
          });
      },
    };
  };
}

export class WithInstallHelpers extends React.Component {
  static propTypes = {
    WrappedComponent: PropTypes.func.isRequired,
    hasAddonManager: PropTypes.bool.isRequired,
    installTheme: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    setCurrentStatus: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }

  static defaultProps = {
    hasAddonManager: addonManager.hasAddonManager(),
    installTheme,
  }

  componentDidMount() {
    const { hasAddonManager, setCurrentStatus } = this.props;
    if (hasAddonManager) {
      log.info('Setting add-on status');
      setCurrentStatus();
    } else {
      log.info('No addon manager, cannot set add-on status');
    }
  }

  render() {
    const { WrappedComponent, ...props } = this.props;
    return <WrappedComponent {...props} />;
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
