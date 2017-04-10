/* @flow */
/* global $Shape */

// This is a workaround for exact object types when you can't use the pipe
// syntax: https://flowtype.org/en/docs/types/objects/#toc-exact-object-types
//
// At the time of this writing, you may need to use this workaround if you
// want to use the spread operator to merge objects together. See:
// https://github.com/facebook/flow/issues/2405#issuecomment-274073091
//
// Usage:
//
// Let's say you have a loosely defined parameter type for a function like this:
//
// type GetAllAddonsParams = {
//   categoryId: number,
// };
//
// You can make sure this function accepts *only* these parameters like this:
//
// function getAllAddons({ categoryId }: Exact<GetAllAddonsParams> = {}) {
//   ...
// }
export type Exact<T> = T & $Shape<T>;
