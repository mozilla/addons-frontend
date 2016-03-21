import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './containers/App';
import discoRoutes from '../disco/routes';
import searchRoutes from '../search/routes';

export default (
  <Route path="/">
    <IndexRoute component={App} />
    {searchRoutes}
    {discoRoutes}
  </Route>
);
