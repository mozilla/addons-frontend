import React, { PropTypes } from 'react';

export default class HoverIntent extends React.Component {
  static propTypes = {
    sensitivity: PropTypes.number,
    interval: PropTypes.number,
    onHoverIntent: PropTypes.func.isRequired,
    onHoverIntentEnd: PropTypes.func.isRequired,
    children: PropTypes.element.isRequired,
  }

  static defaultProps = {
    sensitivity: 5,
    interval: 100,
  }

  componentWillUnmount() {
    this.isHoverIntended = false;
    this.clearHoverIntentDetection();
  }

  onMouseOver = (e) => {
    e.persist();
    const currentTarget = e.currentTarget;

    const sq = (x) => x * x;
    const distanceSq = (p1, p2) => sq(p1.x - p2.x) + sq(p1.y - p2.y);

    const sensitivitySq = sq(this.props.sensitivity);

    const initialPosition = { x: e.clientX, y: e.clientY };
    let previousPosition = initialPosition;
    this.currentMousePosition = initialPosition;

    this.interval = setInterval(() => {
      const currentPosition = this.currentMousePosition;
      if (distanceSq(initialPosition, currentPosition) > sensitivitySq &&
        distanceSq(previousPosition, currentPosition) < sensitivitySq) {
        this.clearHoverIntentDetection();
        this.isHoverIntended = true;

        // construct a fake event cloned from e, but with e's initial currentTarget
        // (currentTarget will change as the event bubbles up the DOM.)
        this.props.onHoverIntent(Object.assign({}, e, { currentTarget }));
      }

      previousPosition = currentPosition;
    }, this.props.interval);
  }

  onMouseOut = (e) => {
    this.clearHoverIntentDetection();
    if (this.isHoverIntended) {
      this.isHoverIntended = false;
      this.props.onHoverIntentEnd(e);
    }
  }

  onMouseMove = (e) => {
    this.currentMousePosition = { x: e.clientX, y: e.clientY };
  }

  clearHoverIntentDetection() {
    clearInterval(this.interval);
  }

  render() {
    const child = React.Children.only(this.props.children);

    return React.cloneElement(child, {
      onMouseOver: this.onMouseOver,
      onMouseOut: this.onMouseOut,
      onMouseMove: this.onMouseMove,
    });
  }
}
