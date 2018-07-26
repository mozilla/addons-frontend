import config from 'config';

import createClient from 'core/client/base';
// Init tracking.
import tracking from 'core/tracking';
import getInstallData from 'disco/tracking';

import App from './components/App';
import sagas from './sagas';
import createStore from './store';

// Having disabled the initial page view beacon in config
// we send our own with custom dimension data.
if (config.get('trackingSendInitPageView') === false) {
  const installData = getInstallData();
  tracking.pageView({
    dimension1: installData.hasExtensions,
    dimension2: installData.hasThemes,
  });
}

createClient(createStore, { sagas }).then(({ renderApp }) => {
  renderApp(App);

  if (module.hot) {
    module.hot.accept('./components/App', () => {
      // eslint-disable-next-line global-require
      const NextApp = require('./components/App').default;
      renderApp(NextApp);
    });
  }
});
