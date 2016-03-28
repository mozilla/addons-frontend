import makeClient from './base';
import routes from '../routes';
import createStore from 'search/store';

makeClient(routes, createStore);
