import makeClient from 'core/client/base';

// Initialize the tracking.
import 'core/tracking';

import App from './components/App';
import sagas from './sagas';
import createStore from './store';

makeClient(App, createStore, { sagas });

if (module.hot) {
  module.hot.accept();
}
