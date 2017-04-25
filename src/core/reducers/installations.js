import {
  DOWNLOAD_PROGRESS,
  DOWNLOADING,
  ERROR,
  INSTALLED,
  INSTALL_CANCELLED,
  INSTALL_COMPLETE,
  INSTALL_ERROR,
  INSTALL_STATE,
  START_DOWNLOAD,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  UNINSTALLED,
  UNINSTALL_COMPLETE,
} from 'core/constants';
import log from 'core/logger';


export function loadAddon({ guid, state }) {
  if (state[guid]) {
    return { ...state[guid] };
  }

  log.warn(`No add-on with guid ${guid} found.`);
  return null;
}

export default function installations(state = {}, { type, payload }) {
  let addon;

  switch (type) {
    case INSTALL_STATE:
      addon = {
        guid: payload.guid,
        url: payload.url,
        error: payload.error,
        downloadProgress: 0,
        status: payload.status,
        needsRestart: payload.needsRestart || false,
      };

      return { ...state, [payload.guid]: addon };
    case START_DOWNLOAD:
      addon = loadAddon({ guid: payload.guid, state });

      addon.status = DOWNLOADING;

      return { ...state, [payload.guid]: addon };
    case DOWNLOAD_PROGRESS:
      addon = loadAddon({ guid: payload.guid, state });

      addon.downloadProgress = payload.downloadProgress;

      return { ...state, [payload.guid]: addon };
    case INSTALL_COMPLETE:
      addon = loadAddon({ guid: payload.guid, state });

      addon.status = INSTALLED;

      return { ...state, [payload.guid]: addon };
    case UNINSTALL_COMPLETE:
      addon = loadAddon({ guid: payload.guid, state });

      addon.status = UNINSTALLED;

      return { ...state, [payload.guid]: addon };
    case INSTALL_CANCELLED:
      addon = loadAddon({ guid: payload.guid, state });

      addon.downloadProgress = 0;
      addon.status = UNINSTALLED;

      return { ...state, [payload.guid]: addon };
    /* istanbul ignore case */
    case INSTALL_ERROR:
      addon = loadAddon({ guid: payload.guid, state });

      addon.downloadProgress = 0;
      addon.status = ERROR;
      addon.error = payload.error;

      return { ...state, [payload.guid]: addon };
    case THEME_PREVIEW:
      addon = loadAddon({ guid: payload.guid, state });

      addon.isPreviewingTheme = true;
      addon.themePreviewNode = payload.themePreviewNode;

      return { ...state, [payload.guid]: addon };
    case THEME_RESET_PREVIEW:
      addon = loadAddon({ guid: payload.guid, state });

      addon.isPreviewingTheme = false;

      return { ...state, [payload.guid]: addon };
    default:
      return state;
  }
}
