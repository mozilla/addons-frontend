import React from 'react';
import { IndexRoute, Route } from 'react-router';

import App from './containers/App';
import DiscoPane from './containers/DiscoPane';

export default (
  <Route path="/disco" component={App}>
    <IndexRoute component={DiscoPane} />
  </Route>
);
