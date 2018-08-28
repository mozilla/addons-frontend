/* @flow */
/* global Node */
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
  UNINSTALLED,
  UNINSTALL_COMPLETE,
} from 'core/constants';
import type { AddonType } from 'core/types/addons';

export type InstalledAddon = {
  downloadProgress?: number,
  error?: string,
  guid: $PropertyType<AddonType, 'guid'>,
  needsRestart?: boolean,
  // TODO: merge with core/constants.validInstallStates
  // once that file supports Flow.
  status?:
    | 'DISABLED'
    | 'DISABLING'
    | 'DOWNLOADING'
    | 'ENABLED'
    | 'ENABLED'
    | 'ENABLING'
    | 'ERROR'
    | 'INACTIVE'
    | 'INSTALLED'
    | 'INSTALLING'
    | 'UNINSTALLED'
    | 'UNINSTALLING'
    | 'UNKNOWN',
  url?: $PropertyType<AddonType, 'url'>,
};

export type InstallationAction = {|
  payload: InstalledAddon,
  type: string,
|};

export type InstallationsState = {
  [guid: $PropertyType<AddonType, 'guid'>]: InstalledAddon,
};

export default function installations(
  state: InstallationsState = {},
  { type, payload }: InstallationAction,
) {
  function updateAddon(newProps: Object): InstalledAddon {
    const { guid } = payload;
    const addon = state[guid];
    if (!addon) {
      throw new Error(
        `Cannot reduce type ${type}; no add-on with guid ${guid} found.`,
      );
    }
    return {
      ...addon,
      ...newProps,
    };
  }

  switch (type) {
    case INSTALL_STATE:
      return {
        ...state,
        [payload.guid]: {
          guid: payload.guid,
          url: payload.url,
          error: payload.error,
          downloadProgress: 0,
          status: payload.status,
          needsRestart: payload.needsRestart || false,
        },
      };
    case START_DOWNLOAD:
      return {
        ...state,
        [payload.guid]: updateAddon({
          status: DOWNLOADING,
        }),
      };
    case DOWNLOAD_PROGRESS:
      return {
        ...state,
        [payload.guid]: updateAddon({
          downloadProgress: payload.downloadProgress,
        }),
      };
    case INSTALL_COMPLETE:
      return {
        ...state,
        [payload.guid]: updateAddon({
          status: INSTALLED,
        }),
      };
    case UNINSTALL_COMPLETE:
      return {
        ...state,
        [payload.guid]: updateAddon({
          status: UNINSTALLED,
        }),
      };
    case INSTALL_CANCELLED:
      return {
        ...state,
        [payload.guid]: updateAddon({
          downloadProgress: 0,
          status: UNINSTALLED,
        }),
      };
    case INSTALL_ERROR:
      return {
        ...state,
        [payload.guid]: updateAddon({
          downloadProgress: 0,
          error: payload.error,
          status: ERROR,
        }),
      };
    default:
      return state;
  }
}
