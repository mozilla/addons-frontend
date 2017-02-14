import classNames from 'classnames';
import React, { PropTypes } from 'react';

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
    visibleOnLoad: PropTypes.bool.isRequired,
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
      <Overlay visibleOnLoad={visibleOnLoad}
        ref={(ref) => { this.overlay = ref; }}>
        <Card
          className={classNames('OverlayCard', className)}
          header={header}
          footerLink={footerLink}
          footerText={footerText}
          ref={(ref) => { this.overlayCard = ref; }}>
          {children}
        </Card>
      </Overlay>
    );
  }
}
