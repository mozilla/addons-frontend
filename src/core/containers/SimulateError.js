import log from 'core/logger';

// This HOC can be connected to a route to test internal error handling.
export default () => {
  log.info('Simulating an error');
  throw new Error('This is a simulated error');
};
