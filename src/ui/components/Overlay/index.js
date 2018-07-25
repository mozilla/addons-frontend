import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import withUIState from 'core/withUIState';

import './styles.scss';

const initialUIState = { visible: false };

export class OverlayBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string.isRequired,
    onEscapeOverlay: PropTypes.func,
    visibleOnLoad: PropTypes.bool,
    uiState: PropTypes.object,
    setUIState: PropTypes.func,
    onClickBackground: PropTypes.func,
  };

  static defaultProps = {
    visibleOnLoad: false,
    uiState: initialUIState,
    setUIState: () => {},
    onClickBackground: () => {},
    onEscapeOverlay: () => {},
  };

  componentWillReceiveProps(nextProps) {
    const { uiState: uiStateOld } = this.props;

    if (
      (nextProps.visibleOnLoad && !uiStateOld.visible) ||
      uiStateOld.visible !== nextProps.uiState.visible
    ) {
      this.props.setUIState({ visible: nextProps.visibleOnLoad });
    }
  }

  // TODO: I don't see this working on the frontend..?
  // find out if this is expected
  onClickBackground = () => {
    if (this.props.onEscapeOverlay) {
      this.props.onEscapeOverlay();
    }
    this.hide();
  };

  hide() {
    this.props.setUIState({ visible: false });
  }

  show() {
    this.props.setUIState({ visible: true });
  }

  toggle() {
    this.props.setUIState({ visible: !this.props.uiState.visible });
  }

  render() {
    const { children, className, id, uiState } = this.props;

    invariant(id, 'The id property is required');

    return (
      <div
        className={makeClassName('Overlay', className, {
          'Overlay--visible': uiState.visible,
        })}
        ref={(ref) => {
          this.overlayContainer = ref;
        }}
      >
        <div
          onClick={this.props.onClickBackground}
          ref={(ref) => {
            this.overlayBackground = ref;
          }}
          className="Overlay-background"
          role="presentation"
        />
        <div
          className="Overlay-contents"
          ref={(ref) => {
            this.overlayContents = ref;
          }}
        >
          {children}
        </div>
      </div>
    );
  }
}

export const extractId = (ownProps) => {
  return ownProps.id;
};

export default compose(
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
  }),
)(OverlayBase);
