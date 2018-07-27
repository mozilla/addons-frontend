import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import withUIState from 'core/withUIState';
import Card from 'ui/components/Card';
import Overlay from 'ui/components/Overlay';

import './styles.scss';

export class OverlayCardBase extends React.Component {
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

    return (
      <Overlay
        onEscapeOverlay={this.props.onEscapeOverlay}
        id={id}
        visibleOnLoad={visibleOnLoad}
        ref={(ref) => {
          this.overlay = ref;
        }}
      >
        <Card
          className={makeClassName('OverlayCard', className)}
          header={header}
          footerLink={footerLink}
          footerText={footerText}
          ref={(ref) => {
            this.overlayCard = ref;
          }}
        >
          {children}
        </Card>
      </Overlay>
    );
  }
}

export const extractId = (ownProps) => {
  return ownProps.id;
};

const OverlayCard = compose(
  withUIState({
    fileName: __filename,
    extractId,
    initialState: {},
  }),
)(OverlayCardBase);

export default OverlayCard;
