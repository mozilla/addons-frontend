import baseServer from '../core/server/base';

import routes from './routes';

const app = baseServer(routes);
export default app;

