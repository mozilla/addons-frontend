import { normalize } from 'normalizr';
import config from 'config';

import createStore from 'amo/store';
import {
  setClientApp, setLang, setAuthToken, setUserAgent,
} from 'core/actions';
import { addon as addonSchema } from 'core/api';
import {
  ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME, CLIENT_APP_FIREFOX,
} from 'core/constants';
import { searchLoad, searchStart } from 'core/actions/search';
import { autocompleteLoad, autocompleteStart } from 'core/reducers/autocomplete';
import { loadUserProfile } from 'core/reducers/user';

import {
  createStubErrorHandler,
  createUserProfileResponse,
  userAuthToken,
  sampleUserAgent,
  signedInApiState as coreSignedInApiState,
} from '../helpers';

export const fakeAddon = Object.freeze({
  authors: [{
    name: 'Krupa',
    url: 'http://olympia.dev/en-US/firefox/user/krupa/',
  }],
  average_daily_users: 100,
  categories: { firefox: ['other'] },
  current_beta_version: null,
  current_version: {
    id: 123,
    license: { name: 'tofulicense', url: 'http://license.com/' },
    version: '2.0.0',
    files: [{
      is_webextension: true,
    }],
    is_strict_compatibility_enabled: false,
  },
  description: 'This is a longer description of the chill out add-on',
  default_locale: 'en-US',
  edit_url: 'https://addons.m.o/addon/chill-out/edit',
  guid: '1234@my-addons.firefox',
  has_eula: true,
  has_privacy_policy: true,
  homepage: 'http://hamsterdance.com/',
  id: 1234,
  icon_url: 'https://addons.cdn.mozilla.net/webdev-64.png',
  is_disabled: false,
  is_experimental: false,
  is_featured: false,
  is_source_public: true,
  last_udpated: '2014-11-22T10:09:01Z',
  name: 'Chill Out',
  previews: [{
    id: 1234778,
    caption: 'Chill out control panel',
    image_url: 'https://addons.cdn.mozilla.net/123/image.png',
    thumbnail_url: 'https://addons.cdn.mozilla.net/7123/image.png',
  }],
  public_stats: true,
  ratings: {
    count: 10,
    average: 3.5,
  },
  requires_payment: false,
  review_url: 'https://addons.m.o/en-US/editors/review/2377',
  slug: 'chill-out',
  status: 'public',
  summary: 'This is a summary of the chill out add-on',
  support_email: null,
  support_url: 'http://support.hampsterdance.com/',
  tags: ['chilling'],
  type: ADDON_TYPE_EXTENSION,
  url: 'https://addons.m.o/addon/chill-out/',
  weekly_downloads: 900023,
});

export const fakeTheme = Object.freeze({
  ...fakeAddon,
  authors: [{
    name: 'Madonna',
    url: 'http://olympia.dev/en-US/firefox/user/madonna/',
  }],
  description: 'This is the add-on description',
  guid: 'dancing-daisies-theme@my-addons.firefox',
  id: 54321,
  name: 'Dancing Daisies by MaDonna',
  slug: 'dancing-daisies',
  theme_data: {
    accentcolor: '#71eafa',
    author:	'MaDonna',
    category: 'Nature',
    description: 'This is theme_data description',
    detailURL: 'https://addons.m/o/dancing-daisies-by-madonna/',
    footer:	'https://addons.cdn.mozilla.net/610804/footer.png',
    footerURL:	'https://addons.cdn.mozilla.net/610804/footer.png',
    header: 'https://addons.cdn.mozilla.net/610804/header.png',
    headerURL: 'https://addons.cdn.mozilla.net/610804/header.png',
    iconURL: 'https://addons.cdn.mozilla.net/610804/icon.png',
    id: 54321,
    name:	'Dancing Daisies by MaDonna',
    previewURL:	'https://addons.cdn.mozilla.net/610804/preview.png',
    updateURL:	'https://versioncheck.m.o/themes/update-check/610804',
    textcolor: '#ffffff',
    version: '1.0',
  },
  type: ADDON_TYPE_THEME,
});

export const fakeReview = Object.freeze({
  id: 8876,
  // The API only provides a minimal add-on representation.
  addon: {
    id: fakeAddon.id,
    slug: fakeAddon.slug,
  },
  created: '2017-01-09T21:49:14Z',
  rating: 3,
  version: fakeAddon.current_version,
  user: {
    id: 1234,
    name: 'fred',
    url: 'http://some.com/link/to/profile',
  },
  is_latest: false,
  body: 'It is Okay',
  title: 'Review Title',
});

export const fakeCategory = Object.freeze({
  application: CLIENT_APP_FIREFOX,
  description: 'I am a cool category for doing things',
  id: 5,
  misc: false,
  name: 'Testing category',
  slug: 'test',
  type: ADDON_TYPE_THEME,
  weight: 1,
});

/*
 * Redux store state for when a user has signed in.
 */
export const signedInApiState = Object.freeze({
  ...coreSignedInApiState,
  clientApp: 'firefox',
});

export function dispatchClientMetadata({
  store = createStore().store,
  clientApp = 'android',
  lang = 'en-US',
  userAgent = sampleUserAgent,
} = {}) {
  store.dispatch(setClientApp(clientApp));
  store.dispatch(setLang(lang));
  store.dispatch(setUserAgent(userAgent));

  return {
    store,
    state: store.getState(),
  };
}

export function dispatchSignInActions({
  authToken = userAuthToken(),
  userId = 12345,
  ...otherArgs
} = {}) {
  const { store } = dispatchClientMetadata(otherArgs);

  store.dispatch(setAuthToken(authToken));
  store.dispatch(loadUserProfile({
    profile: createUserProfileResponse({ id: userId }),
  }));

  return {
    store,
    state: store.getState(),
  };
}

export function dispatchSearchResults({
  addons = {
    [fakeAddon.slug]: fakeAddon,
    'some-other-slug': { ...fakeAddon, slug: 'some-other-slug' },
  },
  filters = { query: 'test' },
  store = dispatchClientMetadata().store,
} = {}) {
  store.dispatch(searchStart({
    errorHandlerId: createStubErrorHandler().id,
    filters,
  }));
  store.dispatch(searchLoad({
    entities: { addons },
    result: {
      count: Object.keys(addons).length,
      results: Object.keys(addons),
    },
  }));

  return { store };
}

export function createAddonsApiResult(results) {
  // Return a normalized add-ons response just like many utility functions do.
  // For example: core.api.featured(), core.api.search()...
  return normalize({ results }, { results: [addonSchema] });
}

export function createFakeAutocompleteResult({ name = 'suggestion-result' } = {}) {
  return {
    id: Date.now(),
    icon_url: `${config.get('amoCDN')}/${name}.png`,
    name,
    url: `https://example.org/en-US/firefox/addons/${name}/`,
  };
}

export function createFakeAddon({ files = {} } = {}) {
  return {
    ...fakeAddon,
    current_version: {
      ...fakeAddon.current_version,
      files,
    },
  };
}

export function dispatchAutocompleteResults({
  filters = { query: 'test' },
  store = dispatchClientMetadata().store,
  results = [],
} = {}) {
  store.dispatch(autocompleteStart({
    errorHandlerId: createStubErrorHandler().id,
    filters,
  }));
  store.dispatch(autocompleteLoad({ results }));

  return { store };
}
