/* @flow */
import invariant from 'invariant';

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
} from 'amo/constants';
import type { AddonType } from 'amo/types/addons';

export type InstalledAddonStatus =
  | 'DISABLED'
  | 'DISABLING'
  | 'DOWNLOADING'
  | 'ENABLED'
  | 'ENABLING'
  | 'ERROR'
  | 'INACTIVE'
  | 'INSTALLED'
  | 'INSTALLING'
  | 'UNINSTALLED'
  | 'UNINSTALLING'
  | 'UNKNOWN';

export type InstalledAddon = {
  canUninstall?: boolean,
  downloadProgress?: number,
  error?: string,
  guid: $PropertyType<AddonType, 'guid'>,
  needsRestart?: boolean,
  status: InstalledAddonStatus,
  url?: $PropertyType<AddonType, 'url'>,
  version?: string,
};

export type InstallationsState = {
  [guid: $PropertyType<AddonType, 'guid'>]: InstalledAddon,
};

export type InstallationAction = {|
  payload: InstalledAddon,
  type: string,
|};

export function setInstallState(
  installation: InstalledAddon,
): InstallationAction {
  return {
    type: INSTALL_STATE,
    payload: installation,
  };
}

type SetInstallErrorParams = {|
  guid: string,
  error: string,
|};

type SetInstallErrorAction = {|
  type: typeof INSTALL_ERROR,
  payload: SetInstallErrorParams,
|};

export const setInstallError = ({
  guid,
  error,
}: SetInstallErrorParams): SetInstallErrorAction => {
  invariant(guid, 'guid is required');

  return {
    type: INSTALL_ERROR,
    payload: {
      guid,
      error,
    },
  };
};

export default function installations(
  // eslint-disable-next-line default-param-last
  state: InstallationsState = {},
  { type, payload }: InstallationAction,
): InstallationsState {
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
          // By default, we should be able to uninstall an add-on.
          canUninstall:
            typeof payload.canUninstall !== 'undefined'
              ? payload.canUninstall
              : true,
          downloadProgress: 0,
          error: payload.error,
          guid: payload.guid,
          needsRestart: payload.needsRestart || false,
          status: payload.status,
          url: payload.url,
          version: payload.version,
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
