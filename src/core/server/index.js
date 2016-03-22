import baseServer from './base';
import routes from '../routes';
import createStore from 'search/store';

const app = baseServer(routes, createStore);

export default app;
