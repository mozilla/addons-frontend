import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { fetchAddon } from 'core/api';
import { loadEntities } from 'search/actions';

class AddonPage extends React.Component {
  static propTypes = {
    addon: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }),
    slug: PropTypes.string.isRequired,
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
        <p>This is the page for {slug}.</p>
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

export function findAddon(state, slug) {
  return state.addons[slug];
}

export function loadAddonIfNeeded({store: {dispatch, getState}, params: {slug}}) {
  const addon = findAddon(getState(), slug);
  if (addon) {
    return addon;
  }
  return fetchAddon(slug).then(({entities}) => dispatch(loadEntities(entities)));
}

const CurrentAddonPage = asyncConnect([{
  deferred: true,
  promise: loadAddonIfNeeded,
}])(connect(mapStateToProps)(AddonPage));

export default CurrentAddonPage;
