import log from 'core/logger';

// This HOC can be connected to a route to test internal error handling.
export default ({ _setTimeout = setTimeout } = {}) => {
  log.info('Simulating an error');
  _setTimeout(() => {
    throw new Error('This is a simulated error in the event loop');
  }, 50);
  throw new Error('This is a simulated error in Component.render()');
};
