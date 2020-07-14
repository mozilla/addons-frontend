/* @flow */
import httpContext from 'express-http-context';
import { v4 as uuidv4 } from 'uuid';
import type { $Request, $Response, NextFunction, Middleware } from 'express';

import { AMO_REQUEST_ID_HEADER } from 'core/constants';

// This middleware adds a correlation ID to the HTTP context and response.
const requestId = (
  req: $Request,
  res: $Response,
  next: NextFunction,
  { _httpContext = httpContext }: {| _httpContext: typeof httpContext |} = {},
): Middleware => {
  const amoRequestId = req.headers[AMO_REQUEST_ID_HEADER] || uuidv4();
  // Make sure a request header is always set. This is mainly for Sentry errors.
  req.headers[AMO_REQUEST_ID_HEADER] = amoRequestId;

  _httpContext.set(AMO_REQUEST_ID_HEADER, amoRequestId);
  res.setHeader(AMO_REQUEST_ID_HEADER, amoRequestId);
  next();
};

export default requestId;
