import makeClassName from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import './Overlay.scss';


export default class Overlay extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    onEscapeOverlay: PropTypes.func,
    visibleOnLoad: PropTypes.bool,
  }

  static defaultProps = {
    visibleOnLoad: false,
  }

  constructor(props) {
    super(props);
    this.state = { visible: props.visibleOnLoad };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.visibleOnLoad !== undefined) {
      this.setState({ visible: nextProps.visibleOnLoad });
    }
  }

  onClickBackground = () => {
    if (this.props.onEscapeOverlay) {
      this.props.onEscapeOverlay();
    }
    this.hide();
  }

  hide() {
    this.setState({ visible: false });
  }

  show() {
    this.setState({ visible: true });
  }

  toggle() {
    this.setState({ visible: !this.state.visible });
  }

  render() {
    const { children, className } = this.props;

    return (
      <div
        className={makeClassName('Overlay', className, { 'Overlay--visible': this.state.visible })}
        ref={(ref) => { this.overlayContainer = ref; }}
      >
        <div
          onClick={this.onClickBackground}
          ref={(ref) => { this.overlayBackground = ref; }}
          className="Overlay-background"
          role="presentation"
        />
        <div
          className="Overlay-contents"
          ref={(ref) => { this.overlayContents = ref; }}
        >
          {children}
        </div>
      </div>
    );
  }
}
