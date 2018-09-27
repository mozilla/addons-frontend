import log from 'core/logger';

// This does not accurately log response time.
// TODO: port this to responseTime() like datadogTiming.js
export function logRequests(req, res, next) {
  const start = new Date();
  next();
  const finish = new Date();
  const elapsed = finish - start;
  log.debug({ req, res, start, finish, elapsed });
}
