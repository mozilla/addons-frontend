/* global CustomEvent, document, window */
import { connect } from 'react-redux';
import { oneLine } from 'common-tags';
import config from 'config';

import log from 'core/logger';
import tracking, { getAction } from 'core/tracking';
import {
  CLOSE_INFO,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  EXTENSION_TYPE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_CATEGORY,
  INSTALL_ERROR,
  INSTALL_FAILED,
  INSTALL_STATE,
  SET_ENABLE_NOT_AVAILABLE,
  SHOW_INFO,
  START_DOWNLOAD,
  UNINSTALL_CATEGORY,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import * as addonManager from 'core/addonManager';

export function makeProgressHandler(dispatch, guid) {
  return (addonInstall, event) => {
    if (addonInstall.state === 'STATE_DOWNLOADING') {
      const downloadProgress = parseInt(
        (100 * addonInstall.progress) / addonInstall.maxProgress, 10);
      dispatch({ type: DOWNLOAD_PROGRESS, payload: { guid, downloadProgress } });
    } else if (event.type === 'onDownloadFailed') {
      dispatch({ type: INSTALL_ERROR, payload: { guid, error: DOWNLOAD_FAILED } });
    } else if (event.type === 'onInstallFailed') {
      dispatch({ type: INSTALL_ERROR, payload: { guid, error: INSTALL_FAILED } });
    }
  };
}

export function makeMapDispatchToProps({ src }) {
  return function mapDispatchToProps(
    dispatch,
    {
      _addonManager = addonManager,
      _config = config,
      _dispatchEvent,
      _tracking = tracking,
      ...ownProps
    } = {},
  ) {
    if (config.get('server')) {
      return {};
    }

    if (ownProps.type === EXTENSION_TYPE && ownProps.installURL === undefined) {
      throw new Error(oneLine`installURL is required, ensure component props are set before
        withInstallHelpers is called`);
    }

    // Set the default here otherwise server code will blow up.
    const dispatchEvent = _dispatchEvent || document.dispatchEvent;

    function showInfo({ name, iconUrl, i18n }) {
      if (_config.has('useUiTour') && _config.get('useUiTour')) {
        dispatchEvent(new CustomEvent('mozUITour', {
          bubbles: true,
          detail: {
            action: 'showInfo',
            data: {
              target: 'appMenu',
              icon: iconUrl,
              title: i18n.gettext('Your add-on is ready'),
              text: i18n.sprintf(
                i18n.gettext('Now you can access %(name)s from the toolbar.'),
              { name }),
              buttons: [{ label: i18n.gettext('OK!'), callbackID: 'add-on-installed' }],
            },
          },
        }));
      } else {
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
    }

    return {
      setCurrentStatus() {
        const { guid, installURL } = ownProps;
        const payload = { guid, url: installURL };
        return _addonManager.getAddon(guid)
        .then((addon) => {
          const status = addon.isActive && addon.isEnabled ? ENABLED : DISABLED;
          dispatch({
            type: INSTALL_STATE,
            payload: { ...payload, status },
          });
        }, () => {
          log.info(`Add-on "${guid}" not found so setting status to UNINSTALLED`);
          dispatch({
            type: INSTALL_STATE,
            payload: { ...payload, status: UNINSTALLED },
          });
        })
        .catch((err) => {
          log.error(err);
          // Dispatch a generic error should the success/error functions throw.
          dispatch({
            type: INSTALL_STATE,
            payload: { guid, status: ERROR, error: FATAL_ERROR },
          });
        });
      },

      enable({ _showInfo = showInfo } = {}) {
        const { guid, i18n, iconUrl, name } = ownProps;
        return _addonManager.enable(guid)
          .then(() => {
            _showInfo({ name, iconUrl, i18n });
          })
          .catch((err) => {
            if (err && err.message === SET_ENABLE_NOT_AVAILABLE) {
              log.info(`addon.setEnabled not available. Unable to enable ${guid}`);
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
        const { guid, i18n, iconUrl, installURL, name } = ownProps;
        dispatch({ type: START_DOWNLOAD, payload: { guid } });
        return _addonManager.install(installURL, makeProgressHandler(dispatch, guid), { src })
          .then(() => {
            _tracking.sendEvent({
              action: 'addon',
              category: INSTALL_CATEGORY,
              label: name,
            });
            showInfo({ name, iconUrl, i18n });
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
        dispatch({ type: INSTALL_STATE, payload: { guid, status: UNINSTALLING } });
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

export function withInstallHelpers({ _makeMapDispatchToProps = makeMapDispatchToProps, src }) {
  if (!src) {
    throw new Error('src is required for withInstallHelpers');
  }
  return (Component) => connect(undefined, _makeMapDispatchToProps({ src }))(Component);
}
