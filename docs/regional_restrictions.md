# Regional restrictions

## Rationale

Because of legal reasons, AMO admins have the ability to restrict some add-ons in specific regions of the world.

By design, only the download URL, detail page (and subpages), detail API (and child APIs) are affected. Notably, search is not affected, nor are collections, therefore in regions where it's supposed to be restricted, an add-on can still appear in listings, but its detail page wouldn't load and it wouldn't install.

## Implementation

- Client makes an HTTP request for the detail page to the CDN.
- The CDN, depending on logic described in `caching.md`, either forwards the request to addons-frontend stack or serves a cached response (note that the region is part of the CDN cache key). When forwarding the request, it sets a header with the ISO 3166-1 alpha-2 code.
- addons-frontend makes a request to the `API_HOST` API endpoint passing the region code down as `X-Country-Code` header.
  - Note: addons-frontend nodejs server is run with a custom `API_HOST` through an environnement variable in order to hit internal API host.
- That API request is either served from cache or processed by addons-server passing the region code as a uwsgi `HTTP_X_COUNTRY_CODE` parameter.
  - Note: internal API hosts re-implements the same caching logic as the CDN but in nginx, since it's not behind the CDN. While external API uses the CDN Geolocation header as the `HTTP_X_COUNTRY_CODE` parameter, the internal API forwards the value of the `X-Country-Code` header it received instead.
- addons-server looks at the uwsgi parameter and decides to server an HTTP 451 Unavailable For Legal Reasons response if the region code matches the restriction that has been set on the add-on.
- When processing the API response, addons-frontend returns an error page with that same HTTP status code if necessary.

For navigation past the initial page loaded by the browser, if JavaScript is enabled, clients only make requests to the API, bypassing addons-frontend nodejs stack. In that case the principles described above still apply, with the addons-frontend client directly making the API calls to the external API instead of the internal one.

## Admin bypass

Authenticated requests are not served from cache (nor cached themselves), so a request from an admin user will go directly through to addons-server. From there, if they have the right permission they will be allowed to bypass the restriction entirely.
