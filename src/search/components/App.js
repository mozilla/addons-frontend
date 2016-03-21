import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';

import search from '../reducers/search';
import addons from 'core/reducers/addons';

import 'search/css/App.scss';

const store = createStore(combineReducers({addons, search}));


export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;
    return (
      <Provider store={store}>
        {children}
      </Provider>
    );
  }
}
