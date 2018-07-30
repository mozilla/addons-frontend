/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import withUIState from 'core/withUIState';

import './styles.scss';

type Props = {|
  className?: string,
  children: React.Element<any>,
  id: string,
  onEscapeOverlay?: () => void,
  visibleOnLoad?: boolean,
|};

type UIStateType = {|
  visible: boolean,
|};

const initialUIState: UIStateType = { visible: false };

type InternalProps = {|
  ...Props,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

export class OverlayBase extends React.Component<InternalProps> {
  static defaultProps = {
    visibleOnLoad: false,
  };

  componentWillReceiveProps(nextProps: InternalProps) {
    const { uiState: uiStateOld } = this.props;
    const { visibleOnLoad: visibleOnLoadNew } = nextProps;

    if (
      (visibleOnLoadNew && !uiStateOld.visible) ||
      uiStateOld.visible !== nextProps.uiState.visible
    ) {
      this.props.setUIState({ visible: visibleOnLoadNew });
    }
  }

  hide() {
    this.props.setUIState({ visible: false });
  }

  // TODO: look into this as I don't see this working on the frontend
  // even in other envs.
  onClickBackground = () => {
    if (this.props.onEscapeOverlay) {
      this.props.onEscapeOverlay();
    }
    this.hide();
  };

  render() {
    const { children, className, id, uiState } = this.props;

    invariant(children, 'The children property is required');
    invariant(id, 'The id property is required');

    return (
      <div
        className={makeClassName('Overlay', className, {
          'Overlay--visible': uiState.visible,
        })}
      >
        <div
          className="Overlay-background"
          onClick={this.onClickBackground}
          role="presentation"
        />
        <div className="Overlay-contents">{children}</div>
      </div>
    );
  }
}

export const extractId = (ownProps: InternalProps) => {
  return ownProps.id;
};

const Overlay: React.ComponentType<InternalProps> = compose(
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
  }),
)(OverlayBase);

export default Overlay;
