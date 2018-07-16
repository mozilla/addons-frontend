import config from 'config';
import * as React from 'react';
import { Router, Route } from 'react-router';

import GenericError from 'core/components/ErrorPage/GenericError';
import NotFound from 'core/components/ErrorPage/NotFound';
import SimulateAsyncError from 'core/components/error-simulation/SimulateAsyncError';
import SimulateClientError from 'core/components/error-simulation/SimulateClientError';
import SimulateSyncError from 'core/components/error-simulation/SimulateSyncError';
import App from 'disco/components/App';
import DiscoPane from 'disco/components/DiscoPane';

export default (
  <Router component={App}>
    <Route
      path="/:lang/firefox/discovery/pane/:version/:platform/:compatibilityMode"
      component={DiscoPane}
    />
    <Route path="/:lang/firefox/404" component={NotFound} />
    <Route
      path="/:lang/firefox/500"
      component={config.get('isDevelopment') ? GenericError : NotFound}
    />
    <Route
      path="/:lang/:app/simulate-async-error/"
      component={SimulateAsyncError}
    />
    <Route
      path="/:lang/:app/simulate-client-error/"
      component={SimulateClientError}
    />
    <Route
      path="/:lang/:app/simulate-sync-error/"
      component={SimulateSyncError}
    />
    <Route path="*" component={NotFound} />
  </Router>
);
