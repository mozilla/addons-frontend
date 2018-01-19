import React from 'react';
import PropTypes from 'prop-types';

function square(x) {
  return x * x;
}

function distanceSquared(a, b) {
  return square(a.x - b.x) + square(a.y - b.y);
}

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
    const detector = this.createHoverIntentDetector(e);
    this.interval = setInterval(detector, this.props.interval);
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

  createHoverIntentDetector = (e) => {
    // persist the event so that when we call our callback below, React hasn't
    // reused it and turned it into something else.
    e.persist();
    const { currentTarget } = e;

    const sensitivitySq = square(this.props.sensitivity);

    const initialPosition = { x: e.clientX, y: e.clientY };
    let previousPosition = initialPosition;
    this.currentMousePosition = initialPosition;

    return () => {
      const currentPosition = this.currentMousePosition;
      if (distanceSquared(initialPosition, currentPosition) > sensitivitySq &&
        distanceSquared(previousPosition, currentPosition) < sensitivitySq) {
        this.clearHoverIntentDetection();
        this.isHoverIntended = true;

        // construct a fake event cloned from e, but with e's initial currentTarget
        // (currentTarget will change as the event bubbles up the DOM.)
        this.props.onHoverIntent(Object.assign({}, e, { currentTarget }));
      }

      previousPosition = currentPosition;
    };
  }

  clearHoverIntentDetection() {
    clearInterval(this.interval);
  }

  render() {
    const child = React.Children.only(this.props.children);
    const propOverrides = ['onMouseOver', 'onMouseOut', 'onMouseMove'];

    const newProps = {};
    propOverrides.forEach((propName) => {
      if (child.props[propName]) {
        throw new Error(`Cannot provide the prop [${propName}] on HoverIntent child`);
      }
      newProps[propName] = this[propName];
    });

    return React.cloneElement(child, newProps);
  }
}
