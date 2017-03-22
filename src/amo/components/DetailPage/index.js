import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonDetail from 'amo/components/AddonDetail';
import { UNKNOWN } from 'core/constants';
import { loadAddonIfNeeded, safeAsyncConnect } from 'core/utils';


export class DetailPageBase extends React.Component {
  render() {
    return (
      <div className="DetailPage">
        <AddonDetail {...this.props} />
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.params;
  const addon = state.addons[slug];
  const installation = state.installations[addon.guid] || { status: UNKNOWN };
  return {
    addon,
    ...addon,
    ...installation,
  };
}

export default compose(
  safeAsyncConnect([{
    key: 'DetailPage',
    promise: loadAddonIfNeeded,
  }]),
  connect(mapStateToProps),
)(DetailPageBase);
