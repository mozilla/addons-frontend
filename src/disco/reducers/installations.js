import {
  DOWNLOADING,
  ERROR,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
} from 'disco/constants';

export default function installations(state = {}, { type, payload }) {
  const newState = {...state};
  if (type === 'INSTALL_STATE') {
    newState[payload.slug] = {
      slug: payload.slug,
      guid: payload.guid,
      url: payload.url,
      progress: 0,
      state: payload.state,
    };
    return newState;
  } else if (type === 'START_DOWNLOAD') {
    newState[payload.slug].state = DOWNLOADING;
    return newState;
  } else if (type === 'DOWNLOAD_PROGRESS') {
    newState[payload.slug].progress = payload.progress;
    return newState;
  } else if (type === 'START_INSTALL') {
    const addon = newState[payload.slug];
    addon.progress = 100;
    addon.state = INSTALLING;
    return newState;
  } else if (type === 'INSTALL_COMPLETE') {
    newState[payload.slug].state = INSTALLED;
    return newState;
  } else if (type === 'START_UNINSTALL') {
    const addon = newState[payload.slug];
    addon.progress = 0;
    addon.state = UNINSTALLING;
    return newState;
  } else if (type === 'UNINSTALL_COMPLETE') {
    newState[payload.slug].state = UNINSTALLED;
    return newState;
  } else if (type === 'INSTALL_ERROR') {
    const addon = newState[payload.slug];
    addon.progress = 0;
    addon.state = ERROR;
    addon.error = payload.error;
    return newState;
  }
  return state;
}
