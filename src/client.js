import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import routes from 'routes';

const history = createBrowserHistory();

render(
  <Router children={routes} history={history} />,
  document.getElementById('react-view')
);
