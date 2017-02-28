import defaultConfig from 'config';
import React from 'react';

import log from 'core/logger';
import NotFound from 'amo/components/ErrorPage/NotFound';

// This HOC can be connected to a route to test internal error handling.
export default ({ config = defaultConfig } = {}) => {
  if (!config.get('allowErrorSimulation')) {
    return <NotFound />;
  }
  log.info('Simulating an error');
  setTimeout(() => {
    throw new Error('This is a simulated error in the event loop');
  }, 50);
  throw new Error('This is a simulated error in Component.render()');
};
