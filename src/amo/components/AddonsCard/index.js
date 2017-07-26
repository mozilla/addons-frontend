import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import SearchResult from 'amo/components/SearchResult';
import CardList from 'ui/components/CardList';

import './styles.scss';


export default class AddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    children: PropTypes.node,
    className: PropTypes.string,
    loading: PropTypes.boolean,
    // When loading, this is the number of placeholders
    // that will be rendered.
    placeholderCount: PropTypes.number,
    type: PropTypes.string,
  }

  static defaultProps = {
    loading: false,
    // Set this to the default API page size.
    placeholderCount: 25,
    type: 'list',
  }

  render() {
    const {
      addons,
      children,
      className,
      loading,
      placeholderCount,
      type,
      ...otherProps
    } = this.props;

    const searchResults = [];

    if (addons && addons.length) {
      addons.forEach((addon) => {
        searchResults.push(
          <SearchResult addon={addon} key={addon.slug} />
        );
      });
    } else if (loading) {
      for (let count = 0; count < placeholderCount; count++) {
        searchResults.push(
          <SearchResult key={count} />
        );
      }
    }

    return (
      <CardList
        {...otherProps}
        className={classNames('AddonsCard', `AddonsCard--${type}`, className)}
        ref={(ref) => { this.cardContainer = ref; }}
      >
        {children}
        {searchResults.length ? (
          <ul className="AddonsCard-list">
            {searchResults}
          </ul>
        ) : null}
      </CardList>
    );
  }
}
