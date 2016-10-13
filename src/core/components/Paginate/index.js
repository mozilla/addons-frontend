import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import translate from 'core/i18n/translate';

import './Paginate.scss';


function makePageNumbers({ start, end }) {
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export class PaginateBase extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.object,
    perPage: PropTypes.number,
  }

  static defaultProps = {
    perPage: 20,
    query: {},
  }

  pageCount() {
    return Math.ceil(this.props.count / this.props.perPage);
  }

  makeLink({ currentPage, page, pathname, query, text, className }) {
    if (currentPage === page || page < 1 || page > this.pageCount()) {
      return (<span key={page} className={
        classNames('Paginator-item', 'disabled', className )}>
          {text || page}
        </span>);
    } else {
      const newQuery = { page, ...query };
      return <Link to={{ pathname, query: newQuery }} className={
        classNames('Paginator-item', className )}>{text || page}</Link>;
    }
  }

  render() {
    if (this.pageCount() === 1) {
      return null;
    }

    const { currentPage, i18n, pathname, query } = this.props;

    return (
      <div className="Paginator">
        <div className="Paginator-page-number">
          {i18n.sprintf(
            i18n.gettext('Page %(currentPage)s of %(totalPages)s'),
            { currentPage, totalPages: this.pageCount() }
          )}
        </div>
        <div className="Paginator-links">
          {this.makeLink({ page: currentPage - 1, currentPage, pathname, query, text: i18n.gettext('Previous'), className: 'Paginator-previous' })}
          {this.makeLink({ page: currentPage + 1, currentPage, pathname, query, text: i18n.gettext('Next'), className: 'Paginator-next' })}
        </div>
      </div>
    );
  }
}

export default translate({ withRef: true })(PaginateBase);
