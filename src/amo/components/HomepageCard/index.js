import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import PropTypes from 'prop-types';

import './styles.scss';

export default class HomepageCard extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    footer: PropTypes.node,
    footerLink: PropTypes.node,
    footerText: PropTypes.node,
    header: PropTypes.node,
  };

  render() {
    const {
      children,
      className,
      footer: footerNode,
      footerLink,
      footerText,
      header,
    } = this.props;

    let footer;
    let footerClass;

    if (
      (footerText && footerLink) ||
      (footerLink && footerNode) ||
      (footerText && footerNode)
    ) {
      throw new Error(oneLine`You can only specify exactly one of these props:
        footer, footerLink or footerText.`);
    } else if (footerText) {
      footer = footerText;
      footerClass = 'Card-footer-text';
    } else if (footerLink) {
      footer = footerLink;
      footerClass = 'Card-footer-link';
    } else {
      footer = footerNode;
    }

    return (
      <section
        className={makeClassName('Card', className, {
          'Card--no-footer': !footer,
        })}
      >
        <header className="HomepageCard-header">
          <div className="Card-header-text">{header}</div>

          {footer ? (
            <div className="HomepageCard-footer-in-header">{footer}</div>
          ) : null}
        </header>

        {children ? <div className="Card-contents">{children}</div> : null}

        {footer ? (
          <footer className={makeClassName('HomepageCard-footer', footerClass)}>
            {footer}
          </footer>
        ) : null}
      </section>
    );
  }
}
