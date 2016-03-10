import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';

import CurrentSearchPage from '../containers/CurrentSearchPage';
import search from '../reducers/search';
import addons from 'core/reducers/addons';

import 'search/css/App.scss';

const store = createStore(combineReducers({addons, search}));


export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <CurrentSearchPage />
      </Provider>
    );
  }
}
