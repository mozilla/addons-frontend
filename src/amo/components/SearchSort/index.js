import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import SearchSortLink from 'amo/components/SearchSort/SearchSortLink';
import translate from 'core/i18n/translate';

import './styles.scss';


const DEFAULT_SORT = 'relevance';

export class SearchSortBase extends React.Component {
  static propTypes = {
    filters: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
  }

  state = { sortVisible: false };

  onClick = (event) => {
    event.preventDefault();
    // Blur the search sort toggle if we're closing it, but only if
    // we've clicked on it; if the link was keyboard activated we don't want
    // to mess with focus, see:
    // https://github.com/mozilla/addons-frontend/pull/1544#discussion_r96052790
    this.toggleSort({ allowBlur: true });
  }

  onKeyPress = (event) => {
    event.preventDefault();
    this.toggleSort();
  }

  sortOptions() {
    const { i18n } = this.props;

    return [
      { sort: 'updated', text: i18n.gettext('Recently Updated') },
      { sort: 'relevance', text: i18n.gettext('Relevance') },
      { sort: 'users', text: i18n.gettext('Most Users') },
      { sort: 'rating', text: i18n.gettext('Top Rated') },
    ];
  }

  toggleSort({ allowBlur = false } = {}) {
    if (allowBlur === true && this.state.sortVisible) {
      this.searchToggle.blur();
    }
    this.setState({ sortVisible: !this.state.sortVisible });
  }

  render() {
    const { filters, i18n, pathname } = this.props;
    const { sortVisible } = this.state;
    const currentSort = filters.sort || DEFAULT_SORT;

    return (
      <div className={classNames('SearchSort', {
        'SearchSort--visible': sortVisible,
      })}>
        <a className="SearchSort-toggle" href="#SearchSortOptions"
          onClick={this.onClick} onKeyPress={this.onKeyPress}
          ref={(ref) => { this.searchToggle = ref; }}>
          {i18n.gettext('Sort')}
        </a>
        <ul id="SearchSortOptions" className="SearchSort-list">
          {this.sortOptions().map((option) => (
            <li className="SearchSort-list-item">
              <SearchSortLink currentSort={currentSort} filters={filters}
                pathname={pathname} sort={option.sort}>
                {option.text}
              </SearchSortLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(SearchSortBase);
