import baseServer from 'core/server/base';
import routes from './routes';
import createStore from './store';

const app = baseServer(routes, createStore);

export default app;
