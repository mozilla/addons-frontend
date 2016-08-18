import makeClient from 'core/client/base';

// Initialize the tracking.
import 'core/tracking';

import routes from './routes';
import createStore from './store';

makeClient(routes, createStore);
