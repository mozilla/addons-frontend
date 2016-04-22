import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { fetchAddon } from 'core/api';
import { loadEntities } from 'search/actions';
import { gettext as _ } from 'core/utils';
import NotFound from 'core/components/NotFound';

import './style.scss';

const editRegExpHelper = new RegExp('/firefox/addon/');
const editRegExpPath = '/developers/addon/';
function editUrl(viewUrl) {
  return `${viewUrl.replace(editRegExpHelper, editRegExpPath)}edit`;
}

class AddonPage extends React.Component {
  static propTypes = {
    addon: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }),
    slug: PropTypes.string.isRequired,
  }

  dataItems() {
    const { addon } = this.props;
    const items = [
      [addon.type, 'type'],
      [addon.status, 'status'],
      [<a href={addon.url} target="_blank">{_('View on site')}</a>, 'url'],
      [<a href={editUrl(addon.url)} target="_blank">{_('Edit on site')}</a>, 'edit'],
    ];
    if (addon.homepage) {
      items.push([
        <a href={addon.homepage} rel="external" target="_blank">{_('View homepage')}</a>,
        'homepage',
      ]);
    }
    if (addon.support_email) {
      items.push([
        <a href={`mailto:${addon.support_email}`}>{_('Email support')}</a>,
        'support_email',
      ]);
    }
    if (addon.support_url) {
      items.push([
        <a href={addon.support_url} rel="external" target="_blank">{_('View support site')}</a>,
        'support_url',
      ]);
    }
    return items;
  }

  dataBar(items, dataType) {
    if (items.length === 0) {
      return [];
    }
    return (
      <ul className={`addon--data-bar addon--${dataType}`}>
        {items.map(
          ([item, key]) => <li key={key} className="addon--data-bar--item">{item}</li>)}
      </ul>
    );
  }

  renderVersion(version) {
    if (version) {
      return (
        <div className="addon--current-version">
          <h2>{_('Current version')}</h2>
          {this.dataBar([[version.version, 'version']], 'version-info')}
          <h3>{_('Files')}</h3>
          <ul>
            {version.files.map((file) => (
              <li key={file.id}>
                {this.dataBar([
                  [file.platform, 'platform'],
                  [file.status, 'status'],
                  [`${file.size} bytes`, 'size'],
                  [file.created, 'created'],
                  [<a href={file.url}>{_('Download')}</a>, 'download'],
                ], 'file-info')}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="addon--current-version">
        <h2>{_('No current version')}</h2>
      </div>
    );
  }

  render() {
    const { addon } = this.props;
    if (!addon) {
      return <NotFound />;
    }
    return (
      <div className="addon">
        <h1>{addon.name}</h1>
        <p>{_('Attributes')}</p>
        {this.dataBar(this.dataItems(), 'info')}
        <p>{_('Tags')}</p>
        {this.dataBar(addon.tags.map((tag, i) => [tag, i]), 'tags')}
        <p className="addon--summary">{addon.summary}</p>
        <p className="addon--description">{addon.description}</p>
        {addon.type !== 'Theme' ? this.renderVersion(addon.current_version) : []}
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
  const state = getState();
  const addon = findAddon(state, slug);
  if (addon) {
    return addon;
  }
  return fetchAddon({slug, api: state.api}).then(({entities}) => dispatch(loadEntities(entities)));
}

const CurrentAddonPage = asyncConnect([{
  deferred: true,
  promise: loadAddonIfNeeded,
}])(connect(mapStateToProps)(AddonPage));

export default CurrentAddonPage;
