/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import withUIState from 'core/withUIState';

import './styles.scss';

// TODO: look into this as I don't see this working on the frontend
// even in other envs.
export const onClickBackground = (
  event: SyntheticEvent<HTMLButtonElement>,
  _this: OverlayBase,
) => {
  if (_this.props.onEscapeOverlay) {
    _this.props.onEscapeOverlay();
  }
  _this.hide();
};

type Props = {|
  className?: string,
  children: React.Element<any> | string,
  id: string,
  onEscapeOverlay: Function,
  visibleOnLoad?: boolean,
  _onClickBackground: Function,
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
    uiState: initialUIState,
    setUIState: () => {},
    _onClickBackground: onClickBackground,
  };

  componentWillReceiveProps(nextProps: InternalProps) {
    const { uiState: uiStateOld } = this.props;

    if (
      (nextProps.visibleOnLoad && !uiStateOld.visible) ||
      uiStateOld.visible !== nextProps.uiState.visible
    ) {
      this.props.setUIState({ visible: nextProps.visibleOnLoad });
    }
  }

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
      >
        <div
          className="Overlay-background"
          onClick={(e) => this.props._onClickBackground(e, this)}
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
