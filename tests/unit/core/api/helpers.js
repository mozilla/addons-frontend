/* global Response */
export function generateHeaders(
  headerData = { 'Content-Type': 'application/json' }
) {
  const response = new Response();
  Object.keys(headerData).forEach((key) => (
    response.headers.append(key, headerData[key])
  ));
  return response.headers;
}

export function createApiResponse({
  ok = true, jsonData = {}, ...responseProps
} = {}) {
  const response = {
    ok,
    headers: generateHeaders(),
    json: () => Promise.resolve(jsonData),
    ...responseProps,
  };
  return Promise.resolve(response);
}
