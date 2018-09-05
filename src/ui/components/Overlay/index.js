/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';
import keydown, { Keys } from 'react-keydown';

import withUIState from 'core/withUIState';

import './styles.scss';

const { ESC } = Keys;

type Props = {|
  className?: string,
  children: React.Element<any>,
  id: string,
  onEscapeOverlay?: (event: SyntheticEvent<any>) => void,
  visibleOnLoad?: boolean,
|};

type UIStateType = {|
  visible: boolean,
|};

const initialUIState: UIStateType = { visible: false };

type keyDownType = {|
  event: Object,
|};

type InternalProps = {|
  ...Props,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
  keydown?: keyDownType | void,
|};

export class OverlayBase extends React.Component<InternalProps> {
  static defaultProps = {
    visibleOnLoad: false,
  };

  componentDidMount() {
    const { visibleOnLoad } = this.props;
    this.props.setUIState({ visible: visibleOnLoad });
  }

  componentWillReceiveProps(nextProps: InternalProps) {
    const { uiState } = this.props;
    const { visibleOnLoad: visibleOnLoadNew, keydown: escKeydown } = nextProps;

    // escKeydown.event is only set if the "Esc" key is pressed.
    if (escKeydown && escKeydown.event) {
      this.onClickBackground(escKeydown.event);
    }

    if (
      visibleOnLoadNew !== undefined &&
      visibleOnLoadNew !== uiState.visible
    ) {
      this.props.setUIState({ visible: visibleOnLoadNew });
    }
  }

  onClickBackground = (event: SyntheticEvent<any>) => {
    event.preventDefault();
    if (this.props.onEscapeOverlay) {
      this.props.onEscapeOverlay(event);
    }

    this.hide();
  };

  hide = () => {
    this.props.setUIState({ visible: false });
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

export const extractId = (ownProps: Props) => {
  return ownProps.id;
};

const Overlay: React.ComponentType<Props> = compose(
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
  }),
  keydown(ESC),
)(OverlayBase);

export default Overlay;
