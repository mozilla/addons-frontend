/* @flow */
/* global Event */

// This represents an HTML element event that you can
// expect will have a target property of a known type.
//
// For example, you could express an input event handler
// like:
//
// onInput = (event: ElementEvent<HTMLInputElement>) => {
//   console.log(event.target.value);
// }
export type ElementEvent<TargetType> = {
  target: TargetType,
} & Event;
