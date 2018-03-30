import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';

import './styles.scss';


export default class Card extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    footerLink: PropTypes.node,
    footerText: PropTypes.node,
    header: PropTypes.node,
    photonStyle: PropTypes.bool,
  }

  static defaultProps = {
    // Photon is the name of the new Firefox design language. This flag
    // modifies the card style to left-align the header, add padding, and tweak
    // the styles to be in line with the new photon mocks while we migrate
    // the rest of the site over.
    photonStyle: false,
  }

  render() {
    const {
      children,
      className,
      footerText,
      footerLink,
      header,
      photonStyle,
    } = this.props;

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
      <section
        className={makeClassName('Card', className, {
          'Card--photon': photonStyle,
          'Card--no-header': !header,
          'Card--no-footer': !footer,
        })}
        ref={(ref) => { this.cardContainer = ref; }}
      >
        {header ? (
          <header
            className="Card-header"
            ref={(ref) => { this.header = ref; }}
          >
            {header}
          </header>
        ) : null}

        {children ? (
          <div
            className="Card-contents"
            ref={(ref) => { this.contents = ref; }}
          >
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
