import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './containers/App';
import CurrentSearchPage from './containers/CurrentSearchPage';
import AddonPage from './containers/AddonPage';
import loginRequired from 'core/containers/LoginRequired';
import HandleLogin from 'core/containers/HandleLogin';

export default (
  <Route path="/">
    <Route path="/search" component={loginRequired(App)}>
      <IndexRoute component={CurrentSearchPage} />
      <Route path="addons/:slug" component={AddonPage} />
    </Route>
    <Route path="/fxa-authenticate" component={HandleLogin} />
  </Route>
);
