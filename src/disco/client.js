import makeClient from 'core/client/base';
import routes from './routes';
import createStore from './store';

// Initialize the tracking.
import 'core/tracking';

makeClient(routes, createStore);
