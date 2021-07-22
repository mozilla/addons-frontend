# HTTP requests caching

## Behavior

We currently use Nginx to cache HTTP requests. It works like a standard reverse proxy: when a request comes in, a cache key is generated from various information sent by the client, a cached response is returned if one is found, otherwise the request is forwarded to the origin and returned to the client while being put in cache if appropriate.

For the cache key, we take into account the following parameters:

- Country corresponding to the client IP using GeoIP
- Value of the `frontend_active_experiments` cookie (parsed from the `Cookie` request header) - its absence being a separate value as far as the cache key is concerned
- The following HTTP headers:
  - `Accept-Encoding`
  - `User-Agent`
  - `DNT`

Caching is bypassed if a request comes in with any of the following:

- `frontend_auth_token` cookie (extracted from the Cookie header)
- `disable_caching` query parameter in the URL

If a response is found in the cache with the key, and it's returned and the request never reaches the origin server.

If a response is not found in the cache, the request is forwarded to the origin server, and if the response returned by the origin server contains a `X-Accel-Expire`s header, it's cached using the same logic to determine the key described above. The duration of the cache is the value of that header.

Behind the scenes the cache key is generated with a mix of hardcoded nginx configuration and HTTP headers returned in the `Vary` header(s) in the response. It might include more headers depending on the page, for instance pages doing `Accept-Language` detection add that header to the key automatically by adding it to the Vary header in the response).

The origin will never send `Cache-Control` headers for 40x or 50x responses, as well as requests with a `frontend_auth_token` cookie, so these responses will never be cached no matter what.

## Additional considerations

### Cookies in requests

Caching is bypassed for some cookies as described above, but this is achieved without `Vary`, because we can't `Vary` on a specific cookie, only the whole header, which would include all cookies ever set on the AMO domain, including analytics - so we would likely see an extremely poor cache hit ratio if we did that.

### Cookies in responses

In addition to what's described above, Nginx is currently configured to never cache a response containing the `Set-Cookie` header. This is a safety measure that we could deactivate if needed. The value of the `Set-Cookie` header wouldn't affect the cache key.

### Cache duration

We currently return `180` as the number of seconds to cache responses. Nginx is set to return potentially stale responses while it's populating the cache, so sometimes clients might see a cached response that is a bit older than that.

### API

The API also has a similar caching layer, using a different set of parameters for the cache key: `User-Agent` and `DNT` are ignored, `Origin` is used instead, `frontend_active_experiments` cookie is ignored, and the cache is bypassed for requests coming in with a `sessionid` cookie or `Authorization` header instead of the `frontend_auth_token` cookie.

## Future move to a CDN

Once the plans to move the main AMO domain to a CDN are implemented, CloudFront will replace nginx for the caching layer, but the core principles will remain the same.

There are a couple implementation differences:

- It uses `Cache-Control` header with a `s-maxage` or `max-age` value (the former takes precedence) instead of `X-Accel-Expires`. We already return that header.
- Instead of bypassing the cache the `frontend_auth_token` will be part of the cache key, but since the origin never returns a response with a `Cache-Control` header for requests with that cookie there shouldn't be any functional differences (this is mainly due to a limitation in the way CloudFront configuration works).
- The `Set-Cookie` behavior could be re-implemented if needed but that hasn't been done yet.
