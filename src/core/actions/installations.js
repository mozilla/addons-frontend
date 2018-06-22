/* @flow */
import { INSTALL_STATE } from 'core/constants';
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
