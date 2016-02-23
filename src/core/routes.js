import React from 'react';
import { Route } from 'react-router';

import discoRoutes from '../disco/routes';
import searchRoutes from '../search/routes';

export default (
  <Route children={[discoRoutes, searchRoutes]} />
);
