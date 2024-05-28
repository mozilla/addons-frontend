# HTTP requests caching

## Behavior

We currently have AMO behind a CDN, which caches HTTP requests. It works like a standard reverse proxy: when a request comes in, a cache key is generated from various information sent by the client, a cached response is returned if one is found, otherwise the request is forwarded to the origin and returned to the client while being put in cache if appropriate.

For the cache key, we take into account the following parameters:

- Country corresponding to the client IP using GeoIP
- Value of the `frontend_active_experiments` cookie (parsed from the `Cookie` request header) - its absence being a separate value as far as the cache key is concerned
- The following HTTP headers:
  - `Accept-Encoding`
  - `User-Agent`
  - `DNT`
- The following cookies, extracted from the `Cookie` HTTP header:
- `frontend_active_experiments`
- `sessionid`

If a response is found in the cache with the key, it's returned and the request never reaches the origin server.

If a response is not found in the cache, the request is forwarded to the origin server, and if the response returned by the origin server contains a `Cache-Control: s-maxage=<value>` header, it's cached using the same logic to determine the key described above. The duration of the cache is the value of that header.

Behind the scenes the cache key is generated with a mix of hardcoded CDN configuration and HTTP headers returned in the `Vary` header(s) in the response. It might include more headers depending on the page, for instance pages doing `Accept-Language` detection add that header to the key automatically by adding it to the `Vary` header in the response).

The origin will send a `Cache-Control: s-maxage=<value>` header (causing the CDN to cache the response) on all responses unless the request came in with a `sessionId` or the response being generated is a 40x or 50x. On top of that, a `Cache-Control: max-age=0` is sent by default so browsers themselves never cache the responses, to deal with authentication and back/forward cache interaction.

## Additional considerations

### Cookies in requests

We can't `Vary` on a specific cookie, only the whole header, which would include all cookies ever set on the AMO domain, including analytics - so we would likely see an extremely poor cache hit ratio if we did that. Therefore, cookies that affect the CDN cache are hardcoded in the CDN configuration for a given path pattern. This allows us to cache differently based on the value of `frontend_active_experiments` for instance, but any other cookie not specified in that configuration will be ignored for caching purposes. If a request comes in with a `foo=bar` cookie, it could be served the same response from cache as someone coming in without it.

### Cache duration

We currently return `360` as the number of seconds to cache responses. The CDN might potentially serve stale responses while it's populating the cache, so sometimes clients might see a cached response that is a bit older than that.

### API

The API also has a similar caching layer, using a different set of parameters for the cache key: `User-Agent` and `DNT` are ignored, `Origin` is used instead, `frontend_active_experiments` cookie is ignored, and the cache is bypassed for requests coming in with a `sessionid` cookie or `Authorization` header instead of the `sessionId` cookie.
