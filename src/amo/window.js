/* global window */

// We need a window from jsdom when it does not exist, which is when we are
// running on node (for SSR). 'amo/window' provides this for us, by importing
// jsdom, but we don't want to import that in tests, as the tests already
// import jsdom via the "jsdom" testEnvironment.
let jsDomDocument;
if (typeof window === 'undefined') {
  // eslint-disable-next-line global-require
  const { JSDOM } = require('jsdom');
  jsDomDocument = new JSDOM('', {
    features: {
      // disables resource loading over HTTP / filesystem
      FetchExternalResources: false,
      // do not execute JS within script blocks
      ProcessExternalResources: false,
    },
  });
}

export default (jsDomDocument && jsDomDocument.window) || window;
