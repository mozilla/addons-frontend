import baseServer from 'core/server/base';
import createStore from './store';
import routes from './routes';

const app = baseServer(routes, createStore);

export default app;
