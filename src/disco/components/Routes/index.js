/* @flow */
import config from 'config';
import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import GenericError from 'core/components/ErrorPage/GenericError';
import NotFound from 'core/components/ErrorPage/NotFound';
import DiscoPane from 'disco/pages/DiscoPane';
import SimulateAsyncError from 'core/pages/error-simulation/SimulateAsyncError';
import SimulateClientError from 'core/pages/error-simulation/SimulateClientError';
import SimulateSyncError from 'core/pages/error-simulation/SimulateSyncError';
import type { ConfigType } from 'core/types/config';

type Props = {|
  _config?: ConfigType,
|};

export const DISCO_PANE_PATH =
  '/:lang/firefox/discovery/pane/:version/:platform/:compatibilityMode';

// TODO: remove the comment below once
// https://github.com/yannickcr/eslint-plugin-react/issues/2298 is fixed.
// eslint-disable-next-line react/prop-types
const Routes = ({ _config = config }: Props = {}) => (
  <Switch>
    <Route exact path={DISCO_PANE_PATH} component={DiscoPane} />
    <Route exact path="/:lang/firefox/404" component={NotFound} />
    <Route
      exact
      path="/:lang/firefox/500"
      component={_config.get('isDevelopment') ? GenericError : NotFound}
    />
    <Route
      exact
      path="/:lang/:app/simulate-async-error/"
      component={SimulateAsyncError}
    />
    <Route
      exact
      path="/:lang/:app/simulate-client-error/"
      component={SimulateClientError}
    />
    <Route
      exact
      path="/:lang/:app/simulate-sync-error/"
      component={SimulateSyncError}
    />
    <Route component={NotFound} />
  </Switch>
);

export default Routes;
