import React from 'react';
import { Router, Route } from 'react-router';

import App from './containers/App';
import DiscoPane from './containers/DiscoPane';

export default (
  <Router component={App}>
    <Route
      path="/:lang/firefox/discovery/pane/:version/:platform/:compatibilityMode"
      component={DiscoPane}
    />
  </Router>
);
