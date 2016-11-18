import React from 'react';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { connect } from 'react-redux';

import AddonDetail from 'amo/components/AddonDetail';
import translate from 'core/i18n/translate';
import { loadAddonAndVersionDetail } from 'core/utils';


export class DetailPageBase extends React.Component {
  render() {
    return (
      <div className="full-width no-top-padding">
        <AddonDetail {...this.props} />
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.params;
  const addon = state.addons[slug];
  return {
    addon,
    slug,
    versionDetails: addon && state.version[addon.current_version.id] ?
      state.version[addon.current_version.id] : state.version,
  };
}

export default compose(
  asyncConnect([{
    key: 'DetailPage',
    deferred: true,
    promise: loadAddonAndVersionDetail,
  }]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(DetailPageBase);
