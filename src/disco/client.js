import config from 'config';

import createClient from 'core/client/base';
// Init tracking.
import tracking from 'core/tracking';
import getInstallData from 'disco/tracking';

import App from './components/App';
import sagas from './sagas';
import createStore, { createRootReducer } from './store';

// Having disabled the initial page view beacon in config
// we send our own with custom dimension data.
if (config.get('trackingSendInitPageView') === false) {
  const installData = getInstallData();
  tracking.pageView({
    dimension1: installData.hasExtensions,
    dimension2: installData.hasThemes,
  });
}

createClient(createStore, { sagas }).then(({ history, renderApp, store }) => {
  renderApp(App);

  if (module.hot) {
    // Sagas are not hot-reloadable but this is needed because reducers/store
    // depend on sagas (without this code, the update won't be accepted by Hot
    // React Loader).
    module.hot.accept(['./sagas', './store'], () => {
      // eslint-disable-next-line global-require
      const { reducers } = require('./store');
      store.replaceReducer(createRootReducer({ history, reducers }));
    });

    module.hot.accept('./components/App', () => {
      // eslint-disable-next-line global-require
      const NextApp = require('./components/App').default;
      renderApp(NextApp);
    });
  }
});
