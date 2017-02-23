import classNames from 'classnames';
import React, { PropTypes } from 'react';

import './Card.scss';


export default class Card extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    footerLink: PropTypes.node,
    footerText: PropTypes.node,
    header: PropTypes.node,
  }

  render() {
    const { children, className, footerText, footerLink, header } = this.props;

    let footer;
    let footerClass;
    if (footerText && footerLink) {
      throw new Error(
        'You cannot specify footerLink and footerText at the same time');
    } else if (footerText) {
      footer = footerText;
      footerClass = 'Card-footer-text';
    } else if (footerLink) {
      footer = footerLink;
      footerClass = 'Card-footer-link';
    }

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
          <footer className={footerClass} ref={(ref) => { this.footer = ref; }}>
            {footer}
          </footer>
        ) : null}
      </section>
    );
  }
}
