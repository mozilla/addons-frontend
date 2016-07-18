import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './containers/App';
import Home from './containers/Home';

export default (
  <Route path="/(:lang/)" component={App}>
    <IndexRoute component={Home} />
  </Route>
);
