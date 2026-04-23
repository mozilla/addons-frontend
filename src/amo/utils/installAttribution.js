/* @flow */
/* global window */
//
// Install-time UTM attribution for Firefox.
//
// Problem: Firefox reads `utm_*` query params from `window.location.href` at
// addon install time to record where the install originated (e.g. homepage
// hero, search results, etc.). But having UTM params on every internal link
// pollutes GA4 data by making internal navigation look like external campaign
// traffic.
//
// Solution: Internal links are kept clean (no query params). Instead, the
// install source is stored in Redux (see `reducers/addonInstallSource.js`).
// Right before Firefox's install API is called, we use
// `history.replaceState()` to temporarily inject UTM params into the page
// URL. After install completes (or fails/cancels), we remove them.
//
// External UTM params (from users arriving via external links) are never
// touched — they're already in the URL and Firefox reads them directly.
//
// See also: `installAddon.js` (where inject/remove are called) and
// `SearchResult`, `HeroRecommendation`, `SecondaryHero` (where install
// source is dispatched to Redux on click).
//
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'amo/constants';

// Temporarily add UTM params to the page URL for Firefox install attribution.
// No-op if UTM params are already present (external attribution).
export function injectUTMParams(installSource: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);

  // Don't overwrite UTM params that are already in the URL (from external
  // sources or previous injection).
  if (url.searchParams.has('utm_source')) {
    return;
  }

  url.searchParams.set('utm_source', DEFAULT_UTM_SOURCE);
  url.searchParams.set('utm_medium', DEFAULT_UTM_MEDIUM);
  url.searchParams.set('utm_content', installSource);

  window.history.replaceState(window.history.state, '', url.toString());
}

// Clean up UTM params we injected. Only removes params whose utm_source
// matches DEFAULT_UTM_SOURCE — external UTM params are left untouched.
// Idempotent: safe to call even if no params were injected.
export function removeUTMParams(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);

  // Only remove UTM params that we injected (matching our internal source).
  if (url.searchParams.get('utm_source') !== DEFAULT_UTM_SOURCE) {
    return;
  }

  url.searchParams.delete('utm_source');
  url.searchParams.delete('utm_medium');
  url.searchParams.delete('utm_content');

  window.history.replaceState(window.history.state, '', url.toString());
}
