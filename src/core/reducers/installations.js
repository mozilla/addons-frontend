import {
  DOWNLOAD_PROGRESS,
  DOWNLOADING,
  ERROR,
  INSTALLED,
  INSTALL_COMPLETE,
  INSTALL_ERROR,
  INSTALL_STATE,
  START_DOWNLOAD,
  UNINSTALLED,
  UNINSTALL_COMPLETE,
  acceptedInstallTypes,
} from 'core/constants';


export default function installations(state = {}, { type, payload }) {
  if (!acceptedInstallTypes.includes(type)) {
    return state;
  }
  let addon;
  if (state[payload.guid]) {
    addon = { ...state[payload.guid] };
  }
  if (type === INSTALL_STATE) {
    addon = {
      guid: payload.guid,
      url: payload.url,
      error: payload.error,
      downloadProgress: 0,
      status: payload.status,
      needsRestart: payload.needsRestart || false,
    };
  } else if (type === START_DOWNLOAD) {
    addon.status = DOWNLOADING;
  } else if (type === DOWNLOAD_PROGRESS) {
    addon.downloadProgress = payload.downloadProgress;
  } else if (type === INSTALL_COMPLETE) {
    addon.status = INSTALLED;
  } else if (type === UNINSTALL_COMPLETE) {
    addon.status = UNINSTALLED;
  /* istanbul ignore else */
  } else if (type === INSTALL_ERROR) {
    addon.downloadProgress = 0;
    addon.status = ERROR;
    addon.error = payload.error;
  }
  return {
    ...state,
    [payload.guid]: addon,
  };
}
