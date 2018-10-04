/* @flow */
import invariant from 'invariant';

import { INSTALL_ERROR, INSTALL_STATE } from 'core/constants';
import type {
  InstalledAddon,
  InstallationAction,
} from 'core/reducers/installations';

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
