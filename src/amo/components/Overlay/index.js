/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';
import keydown, { Keys } from 'react-keydown';

import withUIState from 'amo/withUIState';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';

import './styles.scss';

const { ESC } = Keys;

type DefaultProps = {|
  visibleOnLoad?: boolean,
|};

type Props = {|
  ...DefaultProps,
  className?: string,
  children: React.Node,
  id: string,
  onEscapeOverlay?: () => void,
|};

type UIStateType = {|
  visible: boolean,
|};

const initialUIState: UIStateType = { visible: false };

type InternalProps = {|
  ...Props,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
  keydown: {| event: ElementEvent | null |},
|};

export class OverlayBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    visibleOnLoad: false,
  };

  componentDidMount() {
    const { visibleOnLoad } = this.props;
    this.props.setUIState({ visible: visibleOnLoad });
  }

  componentDidUpdate({ uiState }: InternalProps) {
    const { visibleOnLoad: visibleOnLoadNew, keydown: escKeydown } = this.props;

    // Pressing the "Esc" key is the only key that will trigger an update here.
    // escKeydown is only set if the "Esc" key is pressed.
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

  onClickBackground: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();
    if (this.props.onEscapeOverlay) {
      this.props.onEscapeOverlay();
    }

    this.hide();
  };

  hide: () => void = () => {
    this.props.setUIState({ visible: false });
  };

  render(): React.Node {
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

export const extractId = (ownProps: Props): string => {
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
