import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';

import Card from 'amo/components/Card';
import Overlay from 'amo/components/Overlay';
import './styles.scss';

export default class OverlayCard extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    header: PropTypes.node,
    id: PropTypes.string.isRequired,
    footerLink: PropTypes.node,
    footerText: PropTypes.node,
    onEscapeOverlay: PropTypes.func,
    visibleOnLoad: PropTypes.bool,
  };

  static defaultProps = {
    visibleOnLoad: false,
  };

  render() {
    const {
      children,
      className,
      header,
      id,
      footerLink,
      footerText,
      visibleOnLoad,
    } = this.props;
    return <Overlay onEscapeOverlay={this.props.onEscapeOverlay} id={id} visibleOnLoad={visibleOnLoad}>
        <Card className={makeClassName('OverlayCard', className)} header={header} footerLink={footerLink} footerText={footerText}>
          {children}
        </Card>
      </Overlay>;
  }

}