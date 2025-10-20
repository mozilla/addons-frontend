import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import PropTypes from 'prop-types';

import './styles.scss';

export default class Card extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    footer: PropTypes.node,
    footerLink: PropTypes.node,
    footerText: PropTypes.node,
    header: PropTypes.node,
    isHomepageShelf: PropTypes.bool,
    noStyle: PropTypes.bool,
  };

  static defaultProps = {
    isHomepageShelf: false,
    // This converts a card into a mostly unstyled component, which looks great
    // when embedded into another Card (without this attribute set).
    noStyle: false,
  };

  render() {
    const {
      children,
      className,
      footer: footerNode,
      footerLink,
      footerText,
      isHomepageShelf,
      header,
      noStyle,
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
          'Card--no-style': noStyle,
          'Card--no-header': !header,
          'Card--no-footer': !footer,
        })}
      >
        {header ? (
          <header
            className={makeClassName('Card-header', {
              'Card-shelf-header': isHomepageShelf,
            })}
          >
            <div className="Card-header-text">{header}</div>

            {isHomepageShelf && footer ? (
              <footer className="Card-shelf-footer-in-header">{footer}</footer>
            ) : null}
          </header>
        ) : null}

        {children ? <div className="Card-contents">{children}</div> : null}

        {footer ? (
          <footer
            className={makeClassName('Card-footer', {
              'Card-shelf-footer': isHomepageShelf,
              [footerClass]: !noStyle,
            })}
          >
            {footer}
          </footer>
        ) : null}
      </section>
    );
  }
}
