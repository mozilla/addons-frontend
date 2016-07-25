import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './containers/App';
import Home from './containers/Home';
import DetailPage from './containers/DetailPage';

export default (
  <Route path="/:lang/:application" component={App}>
    <IndexRoute component={Home} />
    <Route path="addon/:slug/" component={DetailPage} />
  </Route>
);
