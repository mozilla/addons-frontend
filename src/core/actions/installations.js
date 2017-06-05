/* @flow */
import {
  INSTALL_STATE,
} from 'core/constants';
import type { InstallationAction } from 'core/reducers/installations';

// TODO: test me
// TODO: use this in core/installAddon
export function setInstallState(installation: InstallationAction) {
  return {
    type: INSTALL_STATE,
    payload: installation,
  };
}
