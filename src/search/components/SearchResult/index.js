import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { sprintf } from 'jed';

import { ngettext } from 'core/utils';

import './style.scss';

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

export default class SearchResult extends React.Component {
  static propTypes = {
    result: PropTypes.object.isRequired,
  }

  render() {
    const { result } = this.props;
    return (
      <li className="SearchResult" ref="container">
        <div>
          <img
            className="SearchResult-icon"
            src={result.icon_url}
            height="64"
            width="64"
            alt="Icon"
          />
        </div>
        <div className="SearchResult-main">
          <h2 className="SearchResult-heading">
            <Link to={`/search/addons/${result.slug}`} className="SearchResult-name" ref="name">
              {result.name}
            </Link>
          </h2>
          <div className="SearchResult-info" ref="guid">{result.guid}</div>
          <span className="SearchResult-info" ref="type">{result.type}</span>
          <span className="SearchResult-info" ref="status">{result.status}</span>
          <span className="SearchResult-info" ref="fileCount">
            {fileCountText(result.current_version)}
          </span>
        </div>
        <div className="SearchResult-actions">
          <ResultLink href={result.url} start>Listing</ResultLink>
          <ResultLink href={result.edit_url} middle>Edit</ResultLink>
          <ResultLink href={result.review_url} end>Editors</ResultLink>
        </div>
      </li>
    );
  }
}
