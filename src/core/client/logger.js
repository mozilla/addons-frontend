/* eslint-disable no-console */
import config from 'config';

/*
 * This is the client version of the logger.
 * This module loader is loaded when importing 'core/logger' in the client.
 */

export function bindConsoleMethod(consoleMethodName, _consoleObj = window.console,
                                  _function = Function) {
  let consoleMethod;
  let consoleFunc;
  const appName = config.get('appName');
  if (typeof _consoleObj[consoleMethodName] !== 'undefined') {
    consoleMethod = _consoleObj[consoleMethodName];
  } else {
    throw new Error(`console method "${consoleMethodName}" does not exist`);
  }

  const app = `[${appName}]`;

  if (_function.prototype.bind) {
    consoleFunc = _function.prototype.bind.call(consoleMethod, _consoleObj, app);
  } else {
    // Fallback for IE < 10;
    consoleFunc = function fallbackConsoleFunc(...args) {
      return _function.prototype.apply.apply(consoleMethod, [_consoleObj, app, ...args]);
    };
  }
  return consoleFunc;
}

const log = {};
['log', 'info', 'error', 'warn'].forEach((logMethodName) => {
  log[logMethodName] = bindConsoleMethod(logMethodName);
});

export default log;
