/* @flow */
/* global Node */
import {
  INSTALL_STATE,
  THEME_PREVIEW,
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

// TODO: test me
// TODO: use this in core/installAddon
export function setThemePreviewNode(
  { guid, node }: {| guid: string, node: typeof Node |}
) {
  return {
    type: THEME_PREVIEW,
    payload: {
      guid,
      themePreviewNode: node,
    },
  };
}
