import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';

import createClient from 'core/client/base';

// Initialize the tracking.
import 'core/tracking';

import App from './components/App';
import sagas from './sagas';
import createStore from './store';

createClient(createStore, { sagas }).then(({ history, renderApp, store }) => {
  renderApp(App);

  if (module.hot) {
    module.hot.accept(['./sagas', './store'], () => {
      // eslint-disable-next-line global-require
      const { reducers } = require('./store');
      const nextRootReducer = connectRouter(history)(combineReducers(reducers));
      store.replaceReducer(nextRootReducer);
    });

    module.hot.accept(['./components/App'], () => {
      // eslint-disable-next-line global-require
      const NextApp = require('./components/App').default;
      renderApp(NextApp);
    });
  }
});
