import React from 'react';
import { Route } from 'react-router';

import App from './components/hello-world';

export default (
  <Route name="disco" component={App} path="/disco" />
);
