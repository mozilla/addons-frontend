/* @flow */
import httpContext from 'express-http-context';
import { v4 as uuidv4 } from 'uuid';
import { $Request, $Response, NextFunction, Middleware } from 'express';

import { AMO_REQUEST_ID_HEADER } from 'amo/constants';

// This middleware adds a correlation ID to the HTTP context and response.
//
// Important: we don't pass this ID to the API requests (yet). When we'll do
// that, we'll have to double check that caching won't be a problem given that
// (1) we store the ID in the Redux state and (2) we serialize the entire Redux
// state in the HTML returned by the node server (and that's what gets cached).
const requestId = (
  req: typeof $Request,
  res: typeof $Response,
  next: typeof NextFunction,
  { _httpContext = httpContext }: { _httpContext: typeof httpContext } = {},
): typeof Middleware => {
  const amoRequestId = req.headers[AMO_REQUEST_ID_HEADER] || uuidv4();
  // Make sure a request header is always set.
  req.headers[AMO_REQUEST_ID_HEADER] = amoRequestId;

  _httpContext.set(AMO_REQUEST_ID_HEADER, amoRequestId);
  res.setHeader(AMO_REQUEST_ID_HEADER, amoRequestId);
  next();
};

export default requestId;
