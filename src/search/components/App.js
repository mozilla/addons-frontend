import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

import api from 'core/middleware/api';
import entities from 'core/reducers/entities';

import 'search/css/App.scss';

const store = createStore(
  combineReducers({ entities }),
  applyMiddleware(thunk, api, createLogger()),
);


export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;
    return (
      <Provider store={store}>
        {/* Pass in store so we can do a dispatch in mapStateToProps */}
        {children}
      </Provider>
    );
  }
}
