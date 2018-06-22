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
    photonStyle: PropTypes.bool,
  };

  static defaultProps = {
    // Photon is the name of the new Firefox design language. This flag
    // modifies the card style to left-align the header, add padding, and tweak
    // the styles to be in line with the new photon mocks while we migrate the
    // rest of the site over.
    photonStyle: false,
  };

  render() {
    const {
      children,
      className,
      footer: footerNode,
      footerLink,
      footerText,
      header,
      photonStyle,
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
          'Card--photon': photonStyle,
          'Card--no-header': !header,
          'Card--no-footer': !footer,
        })}
      >
        {header ? <header className="Card-header">{header}</header> : null}

        {children ? <div className="Card-contents">{children}</div> : null}

        {footer ? (
          <footer className={makeClassName('Card-footer', footerClass)}>
            {footer}
          </footer>
        ) : null}
      </section>
    );
  }
}
