import baseServer from '../core/baseServer';

import routes from './routes';

const app = baseServer(routes);
export default app;

