import React from 'react';
import { Route } from 'react-router';

import App from './components/App';
import AddonPage from './containers/AddonPage';
import CurrentSearchPage from './containers/CurrentSearchPage';

export default (
  <Route path="/" component={App}>
    <Route name="search" component={CurrentSearchPage} path="/search" />
    <Route name="addon" component={AddonPage} path="/addons/:slug" />
  </Route>
);
