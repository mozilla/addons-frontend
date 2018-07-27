import createClient from 'core/client/base';

// Initialize the tracking.
import 'core/tracking';

import App from './components/App';
import sagas from './sagas';
import createStore from './store';

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
