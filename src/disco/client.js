import config from 'config';

import makeClient from 'core/client/base';
// Init tracking.
import tracking from 'core/tracking';
import getInstallData from 'disco/tracking';

import routes from './routes';
import createStore from './store';

// Having disabled the initial page view beacon in config
// we send our own with custom dimension data.
if (config.get('trackingSendInitPageView') === false) {
  const installData = getInstallData();
  tracking.pageView({
    dimension1: installData.hasExtensions,
    dimension2: installData.hasThemes,
  });
}

makeClient(routes, createStore);
