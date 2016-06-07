import {
  DOWNLOADING,
  ERROR,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
} from 'disco/constants';

const acceptedTypes = [
  'INSTALL_STATE',
  'START_DOWNLOAD',
  'DOWNLOAD_PROGRESS',
  'START_INSTALL',
  'INSTALL_COMPLETE',
  'START_UNINSTALL',
  'UNINSTALL_COMPLETE',
  'INSTALL_ERROR',
];

export default function installations(state = {}, { type, payload }) {
  if (!acceptedTypes.includes(type)) {
    return state;
  }
  let addon;
  if (state[payload.guid]) {
    addon = {...state[payload.guid]};
  }
  if (type === 'INSTALL_STATE') {
    addon = {
      guid: payload.guid,
      url: payload.url,
      downloadProgress: 0,
      status: payload.status,
    };
  } else if (type === 'START_DOWNLOAD') {
    addon.status = DOWNLOADING;
  } else if (type === 'DOWNLOAD_PROGRESS') {
    addon.downloadProgress = payload.downloadProgress;
  } else if (type === 'START_INSTALL') {
    addon.downloadProgress = 100;
    addon.status = INSTALLING;
  } else if (type === 'INSTALL_COMPLETE') {
    addon.status = INSTALLED;
  } else if (type === 'START_UNINSTALL') {
    addon.downloadProgress = 0;
    addon.status = UNINSTALLING;
  } else if (type === 'UNINSTALL_COMPLETE') {
    addon.status = UNINSTALLED;
  /* istanbul ignore else */
  } else if (type === 'INSTALL_ERROR') {
    addon.downloadProgress = 0;
    addon.status = ERROR;
    addon.error = payload.error;
  }
  return {
    ...state,
    [payload.guid]: addon,
  };
}
