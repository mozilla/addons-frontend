import { normalize } from 'normalizr';
import config from 'config';
import { LOCATION_CHANGE } from 'connected-react-router';

import createStore from 'amo/store';
import {
  setClientApp,
  setLang,
  setAuthToken,
  setUserAgent,
} from 'core/actions';
import { DEFAULT_API_PAGE_SIZE, addon as addonSchema } from 'core/api';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  ENABLED,
  OS_ALL,
} from 'core/constants';
import { searchLoad, searchStart } from 'core/reducers/search';
import {
  autocompleteLoad,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import { loadCurrentUserAccount } from 'amo/reducers/users';
import {
  createStubErrorHandler,
  createUserAccountResponse,
  randomId,
  sampleUserAgent,
  userAuthToken,
} from 'tests/unit/helpers';

export const fakePreview = Object.freeze({
  id: 1,
  caption: 'Image 1',
  image_url: 'https://addons.cdn.mozilla.net/full/1.png',
  thumbnail_url: 'https://addons.cdn.mozilla.net/thumb/1.png',
  image_size: [400, 200],
  thumbnail_size: [200, 100],
});

export const fakePlatformFile = Object.freeze({
  created: '2014-11-22T10:09:01Z',
  hash: 'a1b2c3d4',
  id: 57721,
  is_mozilla_signed_extension: false,
  is_restart_required: false,
  is_webextension: true,
  permissions: ['activeTab', 'webRequest'],
  platform: OS_ALL,
  size: 123,
  status: 'public',
  url: 'https://a.m.o/files/321/addon.xpi',
});

export const fakeAuthor = Object.freeze({
  id: 98811255,
  name: 'Krupa',
  picture_url: 'https://addons.cdn.mozilla.net/static/img/anon_user.png',
  url: 'http://olympia.test/en-US/firefox/user/krupa/',
  username: 'krupa',
});

export const fakeVersion = Object.freeze({
  channel: 'listed',
  compatibility: {
    [CLIENT_APP_ANDROID]: {
      min: '48.0',
      max: '*',
    },
    [CLIENT_APP_FIREFOX]: {
      min: '48.0',
      max: '*',
    },
  },
  edit_url: 'https://addons.m.o/addon/chill-out/edit',
  files: [fakePlatformFile],
  id: 123,
  is_strict_compatibility_enabled: false,
  license: { name: 'tofulicense', url: 'http://license.com/' },
  release_notes: 'Some release notes',
  reviewed: '2014-11-22T10:09:01Z',
  version: '2.0.0',
});

export const fakeAddon = Object.freeze({
  authors: [fakeAuthor],
  average_daily_users: 100,
  categories: { firefox: ['other'] },
  current_version: fakeVersion,
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
  last_updated: '2014-11-22T10:09:01Z',
  name: 'Chill Out',
  previews: [fakePreview],
  public_stats: true,
  ratings: {
    average: 3.5,
    count: 10,
    text_count: 5,
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
  authors: [
    {
      name: 'MaDonna',
      url: 'http://olympia.test/en-US/firefox/user/madonna/',
      username: 'MaDonna',
    },
  ],
  current_version: {
    ...fakeAddon.current_version,
    compatibility: {},
    version: '0',
  },
  description: 'This is the add-on description',
  guid: 'dancing-daisies-theme@my-addons.firefox',
  id: 54321,
  name: 'Dancing Daisies by MaDonna',
  slug: 'dancing-daisies',
  theme_data: {
    accentcolor: '#71eafa',
    author: 'MaDonna',
    category: 'Nature',
    description: 'This is theme_data description',
    detailURL: 'https://addons.m/o/dancing-daisies-by-madonna/',
    footer: 'https://addons.cdn.mozilla.net/610804/footer.png',
    footerURL: 'https://addons.cdn.mozilla.net/610804/footer.png',
    header: 'https://addons.cdn.mozilla.net/610804/header.png',
    headerURL: 'https://addons.cdn.mozilla.net/610804/header.png',
    iconURL: 'https://addons.cdn.mozilla.net/610804/icon.png',
    id: 54321,
    name: 'Dancing Daisies by MaDonna',
    previewURL: 'https://addons.cdn.mozilla.net/610804/preview.png',
    textcolor: '#ffffff',
    updateURL: 'https://versioncheck.m.o/themes/update-check/610804',
    version: '1.0',
  },
  type: ADDON_TYPE_THEME,
});

export const fakeInstalledAddon = Object.freeze({
  downloadProgress: 0,
  error: undefined,
  guid: 'installed-addon@company',
  needsRestart: false,
  status: ENABLED,
  url: 'https://a.m.o/addon/detail/view',
});

export const fakeReview = Object.freeze({
  id: 8876,
  // The API only provides a minimal add-on representation.
  addon: {
    icon_url: 'https://addons.cdn.mozilla.net/webdev-64.png',
    id: fakeAddon.id,
    name: 'fake add-on name',
    slug: fakeAddon.slug,
  },
  created: '2017-01-09T21:49:14Z',
  score: 3,
  version: fakeAddon.current_version,
  user: {
    id: 1234,
    name: 'fred',
    url: 'http://some.com/link/to/profile',
  },
  is_latest: false,
  is_developer_reply: false,
  body: 'It is Okay',
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

export const fakeRecommendations = Object.freeze({
  addons: Array(4).fill(fakeAddon),
  fallbackReason: 'timeout',
  loading: false,
  outcome: 'recommended_fallback',
});

export const onLocationChanged = ({ pathname, search = '', hash = '' }) => {
  return {
    type: LOCATION_CHANGE,
    payload: {
      location: {
        pathname,
        search,
        hash,
      },
      action: 'PUSH',
    },
  };
};

export function dispatchClientMetadata({
  store = createStore().store,
  clientApp = CLIENT_APP_ANDROID,
  lang = 'en-US',
  userAgent = sampleUserAgent,
  pathname = `/${lang}/${clientApp}/`,
} = {}) {
  store.dispatch(setClientApp(clientApp));
  store.dispatch(setLang(lang));
  store.dispatch(setUserAgent(userAgent));

  // Simulate the behavior of `connected-react-router`.
  store.dispatch(onLocationChanged({ pathname }));

  return {
    store,
    state: store.getState(),
  };
}

export function dispatchSignInActions({
  authToken = userAuthToken(),
  userId = 12345,
  userProps = {},
  ...otherArgs
} = {}) {
  const { store } = dispatchClientMetadata(otherArgs);

  store.dispatch(setAuthToken(authToken));
  store.dispatch(
    loadCurrentUserAccount({
      user: createUserAccountResponse({ id: userId, ...userProps }),
    }),
  );

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
  store.dispatch(
    searchStart({
      errorHandlerId: createStubErrorHandler().id,
      filters,
    }),
  );
  store.dispatch(
    searchLoad({
      entities: { addons },
      result: {
        count: Object.keys(addons).length,
        results: Object.keys(addons),
      },
    }),
  );

  return { store };
}

export function createAddonsApiResult(results) {
  // Return a normalized add-ons response just like many utility functions do.
  // For example: core.api.featured(), core.api.search()...
  return normalize(
    {
      count: results.length,
      results,
    },
    {
      results: [addonSchema],
    },
  );
}

export function createFakeAutocompleteResult({
  name = 'suggestion-result',
  ...props
} = {}) {
  return {
    id: randomId(),
    icon_url: `${config.get('amoCDN')}/${name}.png`,
    name,
    url: `https://example.org/en-US/firefox/addons/${name}/`,
    ...props,
  };
}

export function createFakeAddon({
  files = [...fakeAddon.current_version.files],
  compatibility = { ...fakeAddon.current_version.compatibility },
  // eslint-disable-next-line camelcase
  is_strict_compatibility_enabled = fakeAddon.current_version
    .is_strict_compatibility_enabled,
  ...overrides
} = {}) {
  return {
    ...fakeAddon,
    current_version: {
      ...fakeAddon.current_version,
      compatibility,
      files: files.map((fileProps) => {
        return {
          ...fakeAddon.current_version.files[0],
          ...fileProps,
        };
      }),
      is_strict_compatibility_enabled,
    },
    ...overrides,
  };
}

export function dispatchAutocompleteResults({
  filters = { query: 'test' },
  store = dispatchClientMetadata().store,
  results = [],
} = {}) {
  store.dispatch(
    autocompleteStart({
      errorHandlerId: createStubErrorHandler().id,
      filters,
    }),
  );
  store.dispatch(autocompleteLoad({ results }));

  return { store };
}

export const createFakeCollectionDetail = ({
  name = 'My Addons',
  count = 123,
  authorId = 99999,
  authorName = 'John Doe',
  authorUsername = 'johndoe',
  ...params
} = {}) => {
  return {
    addon_count: count,
    author: {
      id: authorId,
      name: authorName,
      url: 'http://olympia.test/en-US/firefox/user/johndoe/',
      username: authorUsername,
    },
    default_locale: 'en-US',
    description: 'some description',
    id: randomId(),
    modified: Date.now(),
    name,
    public: true,
    slug: 'my-addons',
    url: `https://example.org/en-US/firefox/collections/johndoe/my-addons/`,
    uuid: 'ef7e1344-1c3d-4bbb-bbd8-df9d8c9020ec',
    ...params,
  };
};

export function createFakeCollectionAddon({
  addon = fakeAddon,
  notes = null,
} = {}) {
  return { addon, notes };
}

export const createFakeCollectionAddons = ({
  addons = [createFakeCollectionAddon()],
} = {}) => {
  return addons.map(({ addon, notes }) => ({
    addon,
    downloads: 0,
    notes,
  }));
};

export const createFakeCollectionAddonsListResponse = ({
  addons = [createFakeCollectionAddon()],
} = {}) => {
  return {
    count: addons.length,
    page_size: DEFAULT_API_PAGE_SIZE,
    results: createFakeCollectionAddons({ addons }),
  };
};
