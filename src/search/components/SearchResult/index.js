import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import './style.scss';

function fileCount(version) {
  if (version && version.files) {
    return version.files.length;
  }
  return 0;
}

export default class SearchResult extends React.Component {
  static propTypes = {
    result: PropTypes.object.isRequired,
  }

  render() {
    const { result } = this.props;
    return (
      <Link to={`/search/addons/${result.slug}`} className="search-result" ref="container">
        <div className="search-result--name" ref="name">
          {result.name}
        </div>
        <span className="search-result--info" ref="type">{result.type}</span>
        <span className="search-result--info" ref="status">{result.status}</span>
        <span className="search-result--info" ref="fileCount">
          {fileCount(result.current_version)} files
        </span>
      </Link>
    );
  }
}
