import makeClassName from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import Card from 'ui/components/Card';
import Overlay from 'ui/components/Overlay';

import './OverlayCard.scss';


export default class OverlayCard extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    header: PropTypes.node,
    footerLink: PropTypes.node,
    footerText: PropTypes.node,
    onEscapeOverlay: PropTypes.func,
    visibleOnLoad: PropTypes.bool,
  }

  static defaultProps = {
    visibleOnLoad: false,
  }

  hide() {
    this.overlay.hide();
  }

  show() {
    this.overlay.show();
  }

  toggle() {
    this.overlay.toggle();
  }

  render() {
    const {
      children, className, header, footerLink, footerText, visibleOnLoad,
    } = this.props;

    return (
      <Overlay
        onEscapeOverlay={this.props.onEscapeOverlay}
        visibleOnLoad={visibleOnLoad}
        ref={(ref) => { this.overlay = ref; }}
      >
        <Card
          className={makeClassName('OverlayCard', className)}
          header={header}
          footerLink={footerLink}
          footerText={footerText}
          ref={(ref) => { this.overlayCard = ref; }}
        >
          {children}
        </Card>
      </Overlay>
    );
  }
}
