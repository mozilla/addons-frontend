import React from 'react';
import { IndexRoute, Route } from 'react-router';

import HandleLogin from 'core/containers/HandleLogin';

import AddonReview from './components/AddonReview';
import App from './containers/App';
import CategoriesPage from './containers/CategoriesPage';
import CategoryAddons from './containers/CategoryAddons';
import Home from './containers/Home';
import DetailPage from './containers/DetailPage';
import SearchPage from './containers/SearchPage';

export default (
  <Route path="/:lang/:application" component={App}>
    <IndexRoute component={Home} />
    <Route path="addon/:slug/" component={DetailPage} />
    <Route path="addon/:slug/review/:reviewId/" component={AddonReview} />
    <Route path=":addonType/categories/" component={CategoriesPage} />
    <Route path="fxa-authenticate" component={HandleLogin} />
    <Route path="search/" component={SearchPage} />
  </Route>
);
