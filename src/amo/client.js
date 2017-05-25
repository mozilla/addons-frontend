import makeClient from 'core/client/base';

// Initialize the tracking.
import 'core/tracking';

import routes from './routes';
import sagas from './sagas';
import createStore from './store';

makeClient(routes, createStore, { sagas });
