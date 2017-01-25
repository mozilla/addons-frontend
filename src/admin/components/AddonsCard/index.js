import React, { PropTypes } from 'react';

import SearchResult from 'admin/components/SearchResult';
import Card from 'ui/components/Card';

import './AddonsCard.scss';


export default class AddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    children: PropTypes.node,
    footer: PropTypes.node,
    header: PropTypes.node,
  }

  static defaultProps = {
    children: null,
    footer: undefined,
    header: undefined,
  }

  render() {
    const { addons, children, footer, header } = this.props;

    return (
      <Card header={header} footer={footer} className="AddonsCard"
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
