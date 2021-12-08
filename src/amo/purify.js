/* global window */
import createDOMPurify from 'dompurify';

// We need a window from jsdom when it does not exist, which is when we are
// running on node (for SSR). 'amo/window' provides this for us, by importing
// jsdom, but we don't want to import that in tests, as the tests already
// import jsdom via the "jsdom" testEnvironment.
if (typeof window === 'undefined') {
  // eslint-disable-next-line global-require
  global.window = require('amo/window');
}

export default createDOMPurify(window);
