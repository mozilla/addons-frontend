import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './components/App';
import CurrentSearchPage from './containers/CurrentSearchPage';
import AddonPage from './containers/AddonPage';

export default (
  <Route path="/search" component={App}>
    <IndexRoute component={CurrentSearchPage} />
    <Route path="addons/:slug" component={AddonPage} />
  </Route>
);
