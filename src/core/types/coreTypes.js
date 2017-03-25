/* @flow */

// This is a workaround for exact object types that supports es6 spreads.
// https://github.com/facebook/flow/issues/2405#issuecomment-274073091
export type Exact<T> = T & $Shape<T>;
