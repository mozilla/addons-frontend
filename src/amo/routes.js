import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './containers/App';
import Home from './containers/Home';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Home} />
    <Route path="/:lang/" component={Home} />
  </Route>
);
