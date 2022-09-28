import createClient from 'amo/client/base';

// Initialize the tracking.
import 'amo/tracking';

import App from './components/App';
import sagas from './sagas';
import createStore, { createRootReducer } from './store';

createClient(createStore, { sagas }).then(({ renderApp, store }) => {
  renderApp(App);

  if (module.hot) {
    // Sagas are not hot-reloadable but this is needed because reducers/store
    // depend on sagas (without this code, the update won't be accepted by Hot
    // React Loader).
    module.hot.accept(['./sagas', './store'], () => {
      // eslint-disable-next-line global-require
      const { reducers } = require('./store');
      store.replaceReducer(createRootReducer({ reducers }));
    });

    module.hot.accept(['./components/App'], () => {
      // eslint-disable-next-line global-require
      const NextApp = require('./components/App').default;
      renderApp(NextApp);
    });
  }
});
