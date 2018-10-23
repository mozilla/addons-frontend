/* @flow */
import httpContext from 'express-http-context';
import uuidv4 from 'uuid/v4';
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

  _httpContext.set(AMO_REQUEST_ID_HEADER, amoRequestId);
  res.setHeader(AMO_REQUEST_ID_HEADER, amoRequestId);
  next();
};

export default requestId;
