import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { sprintf } from 'jed';

import { ngettext } from 'core/utils';

import './SearchResult.scss';


function fileCount(version) {
  if (version && version.files) {
    return version.files.length;
  }
  return 0;
}

function fileCountText(version) {
  const count = fileCount(version);
  return sprintf(ngettext('%(count)s file', '%(count)s files', count), { count });
}

const ResultLink = ({ children, end, middle, start, ...props }) =>
  <a
    className={classNames('SearchResult-link', 'button', {
      'button-end': end,
      'button-middle': middle,
      'button-start': start,
    })} rel="noopener noreferrer" target="_blank" {...props} >{children}</a>;

ResultLink.propTypes = {
  children: PropTypes.node.isRequired,
  end: PropTypes.bool,
  middle: PropTypes.bool,
  start: PropTypes.bool,
};

export default class AdminSearchResult extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
  }

  render() {
    const { addon } = this.props;
    return (
      <li className="SearchResult">
        <div>
          <img className="SearchResult-icon" src={addon.icon_url} alt="Icon" />
        </div>
        <section className="SearchResult-main">
          <h2 className="SearchResult-heading">
            <Link to={`/search/addons/${addon.slug}`} className="SearchResult-name"
                  ref={(el) => { this.name = el; }}>
              {addon.name}
            </Link>
          </h2>
          <div className="SearchResult-info" ref={(el) => { this.guid = el; }}>
            {addon.guid}
          </div>
          <span className="SearchResult-info" ref={(el) => { this.type = el; }}>
            {addon.type}
          </span>
          <span className="SearchResult-info" ref={(el) => { this.status = el; }}>
            {addon.status}
          </span>
          <span className="SearchResult-info" ref={(el) => { this.fileCount = el; }}>
            {fileCountText(addon.current_version)}
          </span>
        </section>
        <section className="SearchResult-actions">
          <ResultLink href={addon.url} start>Listing</ResultLink>
          <ResultLink href={addon.edit_url} middle>Edit</ResultLink>
          <ResultLink href={addon.review_url} end>Editors</ResultLink>
        </section>
      </li>
    );
  }
}
