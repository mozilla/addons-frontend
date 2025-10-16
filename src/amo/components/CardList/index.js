import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';

import Card from 'amo/components/Card';

import './styles.scss';

export default class CardList extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  };

  render() {
    const { children, className, ...cardProps } = this.props;

    return (
      <Card {...cardProps} className={makeClassName('CardList', className)}>
        {/* Children in this case is expected to be an unordered list, */}
        {/* which will be styled correctly. */}
        {children}
      </Card>
    );
  }
}
