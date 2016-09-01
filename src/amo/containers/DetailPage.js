import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { connect } from 'react-redux';

import AddonDetail from 'amo/components/AddonDetail';
import translate from 'core/i18n/translate';
import { loadAddonIfNeeded } from 'core/utils';

export class DetailPageBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object,
  }

  render() {
    return (
      <div>
        <AddonDetail {...this.props} />
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.params;
  return {
    addon: state.addons[slug],
    slug,
  };
}

export default compose(
  asyncConnect([{
    key: 'DetailPage',
    deferred: true,
    promise: loadAddonIfNeeded,
  }]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(DetailPageBase);
