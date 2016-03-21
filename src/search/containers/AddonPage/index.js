import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { loadAddon } from 'core/api';
import { loadEntities } from 'search/actions';

class AddonPage extends React.Component {
  static propTypes = {
    addon: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }),
    loadData: PropTypes.func.isRequired,
    slug: PropTypes.string.isRequired,
  }

  componentWillMount() {
    const { addon, slug } = this.props;
    if (!addon || addon.slug !== slug) {
      this.props.loadData(slug);
    }
  }

  render() {
    const { slug } = this.props;
    let { addon } = this.props;
    if (!addon) {
      addon = {name: 'Loading...', slug};
    }
    return (
      <div>
        <h1>{addon.name}</h1>
        <p>This is the page for {slug}</p>
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

function loadData(dispatch) {
  return {
    loadData: (slug) => {
      loadAddon(slug).then((response) => {
        dispatch(loadEntities(response.entities));
      });
    },
  };
}

const CurrentAddonPage = connect(mapStateToProps, loadData)(AddonPage);

export default CurrentAddonPage;
