import React, { PropTypes } from 'react';

import SearchResult from 'amo/components/SearchResult';
import CardList from 'ui/components/CardList';


export default class AddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { addons, children, className, ...otherProps } = this.props;

    return (
      <CardList {...otherProps}
        className={className}
        ref={(ref) => { this.cardContainer = ref; }}>
        {children}
        {addons && addons.length ? (
          <ul className="AddonsCard-list">
            {addons.map((addon) => (
              <SearchResult addon={addon} key={addon.slug} />
            ))}
          </ul>
        ) : null}
      </CardList>
    );
  }
}
