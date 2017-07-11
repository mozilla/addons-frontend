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
    type: PropTypes.string,
  }

  static defaultProps = {
    type: 'list',
  }

  render() {
    const { addons, children, className, type, ...otherProps } = this.props;

    return (
      <CardList
        {...otherProps}
        className={classNames('AddonsCard', `AddonsCard--${type}`, className)}
        ref={(ref) => { this.cardContainer = ref; }}
      >
        {children}
        {addons && addons.length ? (
          <ul className="AddonsCard-list">
            {addons.map((addon) => (
              <SearchResult addon={null} key={addon.slug} />
            ))}
          </ul>
        ) : null}
      </CardList>
    );
  }
}
