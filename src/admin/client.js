import makeClient from 'core/client/base';

import routes from './routes';
import createStore from './store';

makeClient(routes, createStore);
