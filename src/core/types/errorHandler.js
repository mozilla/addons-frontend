/* @flow */
import { ErrorHandler } from 'core/errorHandler';

// /core/errorHandler.js is not covered by Flow, but we import ErrorHandlerType
// into many other modules, so it needs to be defined in a file covered by
// Flow
export type ErrorHandlerType = typeof ErrorHandler;
