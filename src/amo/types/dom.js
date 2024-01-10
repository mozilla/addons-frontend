/* @flow */

// This represents an HTML element event that you can
// expect will have a target property of a known type.
//
// For example, you could express an input event handler
// like:
//
// onInput = (event: TypedElementEvent<HTMLInputElement>) => {
//   console.log(event.target.value);
// }
export type TypedElementEvent<TargetType> = {
  target: TargetType,
} & Event;

export type AnchorEvent = SyntheticEvent<HTMLAnchorElement>;
export type ElementEvent = SyntheticEvent<HTMLElement>;
export type InputEvent = SyntheticInputEvent<HTMLElement>;
export type InputOrTextAreaEvent = TypedElementEvent<
  HTMLInputElement | HTMLTextAreaElement,
>;

export type SelectEvent = SyntheticEvent<HTMLSelectElement>;
export type SelectEventWithTarget = TypedElementEvent<HTMLSelectElement>;

export type HTMLElementEventHandlerWithTarget<TargetType> = (
  event: TypedElementEvent<TargetType>,
) => void;

export type HTMLElementEventHandler = (event: ElementEvent) => void;
