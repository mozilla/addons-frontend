import React from 'react';
import { IndexRoute, Route } from 'react-router';

import HandleLogin from 'core/containers/HandleLogin';

import AddonReview from './components/AddonReview';
import AddonReviewList from './components/AddonReviewList';
import App from './containers/App';
import CategoryList from './containers/CategoryList';
import CategoryPage from './containers/CategoryPage';
import FeaturedAddons from './components/FeaturedAddons';
import LandingPage from './components/LandingPage';
import NotFoundPage from './components/NotFoundPage';
import Home from './containers/Home';
import DetailPage from './containers/DetailPage';
import SearchPage from './containers/SearchPage';


export default (
  <Route path="/:lang/:application" component={App}>
    <IndexRoute component={Home} />
    <Route path="addon/:slug/" component={DetailPage} />
    <Route path="addon/:addonSlug/reviews/" component={AddonReviewList} />
    <Route path="addon/:slug/review/:reviewId/" component={AddonReview} />
    <Route path=":visibleAddonType/categories/" component={CategoryList} />
    <Route path=":visibleAddonType/featured/" component={FeaturedAddons} />
    <Route path=":visibleAddonType/:slug/" component={CategoryPage} />
    <Route path="fxa-authenticate" component={HandleLogin} />
    <Route path="search/" component={SearchPage} />
    <Route path=":visibleAddonType/" component={LandingPage} />
    <Route path="*" component={NotFoundPage} />
  </Route>
);
