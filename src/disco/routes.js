import config from 'config';
import React from 'react';
import { Router, Route } from 'react-router';

import GenericError from 'core/components/ErrorPage/GenericError';
import NotFound from 'core/components/ErrorPage/NotFound';
import SimulateAsyncError from
  'core/containers/error-simulation/SimulateAsyncError';
import SimulateSyncError from
  'core/containers/error-simulation/SimulateSyncError';

import App from './containers/App';
import DiscoPane from './containers/DiscoPane';


export default (
  <Router component={App}>
    <Route
      path="/:lang/firefox/discovery/pane/:version/:platform/:compatibilityMode"
      component={DiscoPane}
    />
    <Route path="/:lang/firefox/404" component={NotFound} />
    <Route path="/:lang/firefox/500"
      component={config.get('isDevelopment') ? GenericError : NotFound} />
    <Route
      path="/:lang/firefox/simulate-async-error/"
      component={SimulateAsyncError}
    />
    <Route
      path="/:lang/firefox/simulate-sync-error/"
      component={SimulateSyncError}
    />
    <Route path="*" component={NotFound} />
  </Router>
);
