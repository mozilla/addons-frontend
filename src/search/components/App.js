import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import CurrentSearchPage from '../containers/CurrentSearchPage';
import search from '../reducers/search';
import addons from 'core/reducers/addons';
const store = createStore(combineReducers({addons, search}));

const App = () => (
  <Provider store={store}>
    <CurrentSearchPage />
  </Provider>
);

export default App;
