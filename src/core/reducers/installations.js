/* @flow */
/* global Node, $PropertyType */
import {
  DOWNLOAD_PROGRESS,
  DOWNLOADING,
  ERROR,
  INSTALLED,
  INSTALL_COMPLETE,
  INSTALL_ERROR,
  INSTALL_STATE,
  START_DOWNLOAD,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  UNINSTALLED,
  UNINSTALL_COMPLETE,
  acceptedInstallTypes,
} from 'core/constants';
import type { AddonType } from 'core/types/addons';
import type { Exact } from 'core/types/util';

export type InstalledAddon = {
  downloadProgress?: number,
  error?: string,
  guid: $PropertyType<AddonType, 'guid'>,
  isPreviewingTheme?: boolean,
  needsRestart?: boolean,
  status?: $PropertyType<AddonType, 'status'>,
  themePreviewNode?: Node,
  url?: $PropertyType<AddonType, 'url'>,
};

type InstallationAction = {|
  type: string,
  payload: InstalledAddon,
|};

type InstallationState = {
  [guid: $PropertyType<AddonType, 'guid'>]: InstalledAddon,
};

export default function installations(
  state: InstallationState = {}, { type, payload }: InstallationAction,
) {
  if (!acceptedInstallTypes.includes(type)) {
    return state;
  }
  let addon: Exact<InstalledAddon> = {
    guid: '',
  };
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
  } else if (type === THEME_PREVIEW) {
    addon.isPreviewingTheme = true;
    addon.themePreviewNode = payload.themePreviewNode;
  } else if (type === THEME_RESET_PREVIEW) {
    addon.isPreviewingTheme = false;
  }

  return {
    ...state,
    [payload.guid]: addon,
  };
}
