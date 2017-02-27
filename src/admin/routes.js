import config from 'config';
import React from 'react';
import { IndexRoute, Route } from 'react-router';

import SimulateError from 'core/containers/SimulateError';
import LoginRequired from 'core/containers/LoginRequired';
import HandleLogin from 'core/containers/HandleLogin';

import App from './containers/App';
import AddonPage from './containers/AddonPage';
import SearchPage from './containers/SearchPage';
import UserPage from './containers/UserPage';

export default (
  <Route path="/" component={App}>
    <Route component={LoginRequired}>
      <Route path="search">
        <IndexRoute component={SearchPage} />
        <Route path="addons/:slug" component={AddonPage} />
      </Route>
      <Route path="user" component={UserPage} />
    </Route>
    <Route path="fxa-authenticate" component={HandleLogin} />
    {config.get('allowErrorSimulation') ? (
      <Route path="simulate-error/" component={SimulateError} />
    ) : null}
  </Route>
);
