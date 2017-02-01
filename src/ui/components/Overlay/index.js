import classNames from 'classnames';
import React, { PropTypes } from 'react';

import './Overlay.scss';


export default class Overlay extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    visibleOnLoad: PropTypes.bool.isRequired,
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

  hide() {
    this.setState({ visible: false });
  }

  show() {
    this.setState({ visible: true });
  }

  toggle() {
    this.setState({ visible: !this.state.visible });
  }

  onClickBackground = () => {
    this.hide();
  }

  render() {
    const { children, className } = this.props;

    return (
      <div className={classNames('Overlay', className, {
        'Overlay--visible': this.state.visible,
      })} ref={(ref) => { this.overlayContainer = ref; }}>
        <div
          onClick={this.onClickBackground}
          onTouchEnd={this.onClickBackground}
          className="Overlay-background"
        />
        <div className="Overlay-contents"
          ref={(ref) => { this.overlayContents = ref; }}>
          {children}
        </div>
      </div>
    );
  }
}
