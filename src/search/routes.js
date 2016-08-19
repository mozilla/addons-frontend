import React from 'react';
import { IndexRoute, Route } from 'react-router';

import LoginRequired from 'core/containers/LoginRequired';
import HandleLogin from 'core/containers/HandleLogin';

import App from './containers/App';
import CurrentSearchPage from './containers/CurrentSearchPage';
import AddonPage from './containers/AddonPage';
import UserPage from './containers/UserPage';

export default (
  <Route path="/" component={App}>
    <Route component={LoginRequired}>
      <Route path="search">
        <IndexRoute component={CurrentSearchPage} />
        <Route path="addons/:slug" component={AddonPage} />
      </Route>
      <Route path="user" component={UserPage} />
    </Route>
    <Route path="fxa-authenticate" component={HandleLogin} />
  </Route>
);
