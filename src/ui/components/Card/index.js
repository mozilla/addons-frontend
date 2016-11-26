import classNames from 'classnames';
import React, { PropTypes } from 'react';

import './Card.scss';


export default class Card extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    footer: PropTypes.node,
    header: PropTypes.node,
  }

  render() {
    const { children, className, footer, header } = this.props;

    return (
      <section className={classNames('Card', className, {
        'Card--no-header': !header,
        'Card--no-footer': !footer,
      })} ref={(ref) => { this.cardContainer = ref; }}>
        {header ? (
          <h2 className="Card-header" ref={(ref) => { this.header = ref; }}>
            {header}
          </h2>
        ) : null}

        {children ? (
          <div className="Card-contents"
            ref={(ref) => { this.contents = ref; }}>
            {children}
          </div>
        ) : null}

        {footer ? (
          <footer className="Card-footer" ref={(ref) => { this.footer = ref; }}>
            {footer}
          </footer>
        ) : null}
      </section>
    );
  }
}
