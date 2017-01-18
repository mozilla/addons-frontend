import log from 'core/logger';


const errorPageText = {
  401: 'Unauthorized',
  404: 'Not Found',
  500: 'Internal Server Error',
};

export function getErrorMsg(statusCode) {
  const statusKey = statusCode.toString();
  return errorPageText[statusKey];
}

export function getReduxConnectError(reduxConnectLoadState) {
  // Create a list of any apiErrors detected.
  const apiErrors = Object.keys(reduxConnectLoadState)
    .map((item) => reduxConnectLoadState[item].error)
    .filter((item) => Boolean(item));
  let status;

  if (apiErrors.length === 1) {
    // If we have a single API error reflect that in the page's response.
    status = apiErrors[0].response.status;
  } else if (apiErrors.length > 1) {
    // Otherwise we have multiple api errors it should be logged
    // and throw a 500.
    log.error(apiErrors);
    status = 500;
  }

  return { status, error: status ? getErrorMsg(status) : null };
}
