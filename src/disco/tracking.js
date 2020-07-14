/* global window */

import log from 'core/logger';
import {
  DISCO_DATA_EXTENSION,
  DISCO_DATA_GUID_IGNORE_LIST,
  DISCO_DATA_THEME,
  DISCO_DATA_UNKNOWN,
} from 'disco/constants';

export default function getInstallData({ _window = window } = {}) {
  const count = {
    themes: 0,
    extensions: 0,
  };
  let jsonData = null;
  if (_window && _window.location && _window.location.hash) {
    try {
      const hash = _window
        .decodeURIComponent(_window.location.hash)
        .replace(/^#/, '');
      jsonData = JSON.parse(hash);
    } catch (e) {
      // eslint-disable-next-line amo/only-log-strings
      log.error(e);
    }
  }

  if (!jsonData) {
    return {
      hasThemes: DISCO_DATA_UNKNOWN,
      hasExtensions: DISCO_DATA_UNKNOWN,
    };
  }

  Object.keys(jsonData).forEach((key) => {
    if (DISCO_DATA_GUID_IGNORE_LIST.includes(key)) {
      return;
    }
    const item = jsonData[key];
    if (!item.type) {
      return;
    }
    if (item.type === DISCO_DATA_THEME) {
      count.themes += 1;
    }
    if (item.type === DISCO_DATA_EXTENSION) {
      count.extensions += 1;
    }
  });

  return {
    hasExtensions: count.extensions > 0,
    hasThemes: count.themes > 0,
  };
}
