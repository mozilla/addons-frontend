import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { loadAddon } from 'core/api';

function loadData(props) {
  const { slug } = props;
  props.loadAddon(slug);
}

class AddonPage extends React.Component {
  static propTypes = {
    addon: PropTypes.object,
    loadAddon: PropTypes.func.isRequired,
    slug: PropTypes.string.isRequired,
  };

  componentWillMount() {
    loadData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.slug !== this.props.slug) {
      loadData(nextProps);
    }
  }

  render() {
    const { addon, slug } = this.props;
    let addonDetail;
    if (addon) {
      addonDetail = <h1>{addon.name['en-US']}</h1>;
    } else {
      addonDetail = <p>Loading...</p>;
    }
    return (
      <div>
        {addonDetail}
        <p>{`This addon's slug is ${slug}`}</p>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.params;
  const {
    entities: { addons },
  } = state;
  console.log('map', state, addons);
  return {
    addon: addons[slug],
    slug,
  };
}

export default connect(mapStateToProps, {
  loadAddon,
})(AddonPage);
