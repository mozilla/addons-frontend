import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { connect } from 'react-redux';

import LandingPage from 'amo/components/LandingPage';
import { loadFeatured, loadHighlyRated, loadPopular } from 'amo/utils';


export function setAddonType(state, ownProps) {
  return { addonType: ownProps.params.addonType.replace(/s$/, '') };
}

export function mapStateToProps(state) {
  return {
    featuredAddons: state.featured.results,
    highlyRatedAddons: state.highlyRated.results,
    popularAddons: state.popular.results,
  };
}

export default compose(
  asyncConnect([
    { deferred: true, promise: loadFeatured },
    { deferred: true, promise: loadHighlyRated },
    { deferred: true, promise: loadPopular },
  ]),
  connect(mapStateToProps),
  connect(setAddonType),
)(LandingPage);
