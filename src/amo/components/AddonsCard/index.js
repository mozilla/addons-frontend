import classNames from 'classnames';
import React, { PropTypes } from 'react';

import SearchResult from 'amo/components/SearchResult';
import Card from 'ui/components/Card';

import './AddonsCard.scss';


export default class AddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    children: PropTypes.node,
    className: PropTypes.string,
    footer: PropTypes.node,
    header: PropTypes.node,
  }

  render() {
    const { addons, children, className, footer, header } = this.props;

    return (
      <Card header={header} footer={footer}
        className={classNames('AddonsCard', className)}
        ref={(ref) => { this.cardContainer = ref; }}>
        {children}
        {addons && addons.length ? (
          <ul className="AddonsCard-list">
            {addons.map((addon) => (
              <SearchResult addon={addon} key={addon.slug} />
            ))}
          </ul>
        ) : null}
      </Card>
    );
  }
}
