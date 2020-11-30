/* global Headers, Response */
import urllib from 'url';

import { LOCATION_CHANGE } from 'connected-react-router';
import PropTypes from 'prop-types';
import base64url from 'base64url';
import config from 'config';
import invariant from 'invariant';
import { shallow } from 'enzyme';
import Jed from 'jed';
import UAParser from 'ua-parser-js';
import { oneLine } from 'common-tags';
import { createMemoryHistory } from 'history';

import { DOWNLOAD_FIREFOX_BASE_URL } from 'amo/constants';
import createStore from 'amo/store';
import { getDjangoBase62 } from 'amo/utils';
import { setError } from 'core/actions/errors';
import { createApiError } from 'core/api/index';
import {
  setClientApp,
  setLang,
  setRegionCode,
  setAuthToken,
  setUserAgent,
} from 'core/reducers/api';
import * as coreApi from 'core/api';
import { getAddonStatus } from 'core/addonManager';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  ENABLED,
  OS_ALL,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { makeI18n } from 'core/i18n/utils';
import {
  autocompleteLoad,
  autocompleteStart,
} from 'core/reducers/autocomplete';
import { searchLoad, searchStart } from 'core/reducers/search';
import { selectUIState } from 'core/reducers/uiState';
import { loadCurrentUserAccount } from 'amo/reducers/users';
import { createUIStateMapper, mergeUIStateProps } from 'core/withUIState';
import { addQueryParamsToHistory } from 'core/utils';

export const sampleUserAgent =
  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1';
export const sampleUserAgentParsed = UAParser(sampleUserAgent);

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
  optional_permissions: ['*://developer.mozilla.org/*', 'bookmarks'],
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
  license: {
    is_custom: false,
    name: 'tofulicense',
    url: 'http://license.com/',
  },
  release_notes: 'Some release notes',
  reviewed: '2014-11-22T10:09:01Z',
  version: '2.0.0',
});

export const fakeAddon = Object.freeze({
  authors: [fakeAuthor],
  average_daily_users: 100,
  categories: { firefox: ['other'] },
  contributions_url: '',
  created: '2014-11-22T10:09:01Z',
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
  is_source_public: true,
  last_updated: '2018-11-22T10:09:01Z',
  name: 'Chill Out',
  previews: [fakePreview],
  promoted: null,
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
  type: ADDON_TYPE_STATIC_THEME,
  previews: [fakePreview],
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
    id: 28014,
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

export function createExternalReview({
  addonId = fakeReview.addon.id,
  addonSlug = fakeReview.addon.slug,
  body,
  id = 76654,
  isDeveloperReply = false,
  score = 4,
  userId = fakeReview.user.id,
  versionId = fakeReview.version.id,
} = {}) {
  return {
    ...fakeReview,
    addon: {
      ...fakeAddon,
      id: addonId,
      slug: addonSlug,
    },
    body,
    id,
    is_developer_reply: isDeveloperReply,
    score,
    user: {
      ...fakeReview.user,
      id: userId,
    },
    version: {
      ...fakeReview.version,
      id: versionId,
    },
  };
}

export const fakeCategory = Object.freeze({
  application: CLIENT_APP_FIREFOX,
  description: 'I am a cool category for doing things',
  id: 5,
  misc: false,
  name: 'Testing category',
  slug: 'test',
  type: ADDON_TYPE_STATIC_THEME,
  weight: 1,
});

export const fakeRecommendations = Object.freeze({
  addons: Array(4).fill(fakeAddon),
  fallbackReason: 'timeout',
  loading: false,
  outcome: 'recommended_fallback',
});

export const fakeAddonInfo = {
  eula: 'eula text',
  privacy_policy: ' some privacy policy text',
};

export const fakePrimaryHeroShelfExternal = Object.freeze({
  id: 1,
  guid: 'some-guid',
  homepage: 'https://mozilla.org',
  name: 'some external name',
  type: ADDON_TYPE_EXTENSION,
});

export const createPrimaryHeroShelf = ({
  addon = undefined,
  description = 'Primary shelf description',
  external = undefined,
  featuredImage = 'https://addons-dev-cdn.allizom.org/static/img/hero/featured/teamaddons.jpg',
  gradient = { start: 'color-ink-80', end: 'color-blue-70' },
} = {}) => {
  return {
    addon,
    description,
    external:
      addon === undefined && external === undefined
        ? 'external-link'
        : external,
    featured_image: featuredImage,
    gradient,
  };
};

export const createSecondaryHeroShelf = ({
  cta = { url: 'https://mozilla.org', text: 'Some cta text' },
  description = 'Secondary shelf description',
  headline = 'Secondary shelf headline',
  modules = [
    {
      icon: 'icon1',
      description: 'module 1 description',
      cta: { url: 'https://mozilla.org/1', text: 'module 1 cta text' },
    },
    {
      icon: 'icon2',
      description: 'module 2 description',
      cta: { url: 'https://mozilla.org/2', text: 'module 2 cta text' },
    },
    {
      icon: 'icon3',
      description: 'module 3 description',
      cta: { url: 'https://mozilla.org/3', text: 'module 3 cta text' },
    },
  ],
} = {}) => {
  return {
    cta,
    description,
    headline,
    modules,
  };
};

export const createHeroShelves = ({
  primaryProps = {},
  secondaryProps = {},
} = {}) => {
  return {
    primary: createPrimaryHeroShelf(primaryProps),
    secondary: createSecondaryHeroShelf(secondaryProps),
  };
};

export const onLocationChanged = ({ pathname, search = '', ...others }) => {
  const history = addQueryParamsToHistory({
    history: createMemoryHistory({
      initialEntries: [`${pathname}${search}`],
    }),
  });

  return {
    type: LOCATION_CHANGE,
    payload: {
      location: {
        ...history.location,
        ...others,
      },
      action: 'PUSH',
    },
  };
};

export function dispatchClientMetadata({
  store = createStore().store,
  clientApp = CLIENT_APP_ANDROID,
  lang = 'en-US',
  regionCode = null,
  userAgent = sampleUserAgent,
  pathname = `/${lang}/${clientApp}/`,
  search = '',
} = {}) {
  store.dispatch(setClientApp(clientApp));
  store.dispatch(setLang(lang));
  store.dispatch(setRegionCode(regionCode));
  store.dispatch(setUserAgent(userAgent));

  // Simulate the behavior of `connected-react-router`.
  store.dispatch(onLocationChanged({ pathname, search }));

  return {
    store,
    state: store.getState(),
  };
}

/*
 * Return a fake authentication token that can be
 * at least decoded in a realistic way.
 */
export function userAuthToken(
  dataOverrides = {},
  { tokenCreatedAt = (Date.now() / 1000).toFixed(0), tokenData } = {},
) {
  const data = {
    user_id: 102345,
    ...dataOverrides,
  };

  let encodedToken = tokenData;
  if (!encodedToken) {
    encodedToken = base64url.encode(JSON.stringify(data));
  }

  const base62 = getDjangoBase62();
  const timestamp = base62.encode(tokenCreatedAt);
  const sig = base64url.encode('pretend-this-is-a-signature');

  return `${encodedToken}:${timestamp}:${sig}`;
}

export function createUserAccountResponse({
  id = 123456,
  biography = 'I love making add-ons!',
  username = 'user-1234',
  created = '2017-08-15T12:01:13Z',
  /* eslint-disable camelcase */
  average_addon_rating = 4.3,
  display_name = null,
  fxa_edit_email_url = 'https://example.org/settings',
  is_addon_developer = false,
  is_artist = false,
  num_addons_listed = 1,
  picture_url = `${config.get('amoCDN')}/static/img/zamboni/anon_user.png`,
  picture_type = '',
  homepage = null,
  permissions = [],
  occupation = null,
  location = null,
  site_status = {
    read_only: false,
    notice: null,
  },
  /* eslint-enable camelcase */
  ...otherFields
} = {}) {
  return {
    average_addon_rating,
    biography,
    created,
    display_name,
    fxa_edit_email_url,
    homepage,
    id,
    is_addon_developer,
    is_artist,
    location,
    // This is the API behavior.
    // eslint-disable-next-line camelcase
    name: display_name || username,
    num_addons_listed,
    occupation,
    picture_type,
    picture_url,
    url: null,
    username,
    permissions,
    site_status,
    ...otherFields,
  };
}

export function createStubErrorHandler(capturedError = null) {
  return new ErrorHandler({
    id: 'create-stub-error-handler-id',
    dispatch: sinon.stub(),
    capturedError,
  });
}

export function createCapturedErrorHandler({
  status = 400,
  message = 'Unknown error',
  store = createStore().store,
}) {
  const id = 'error-handler-id';

  const error = createApiError({
    response: { status },
    apiURL: 'https://some/api/endpoint',
    jsonResponse: { message },
  });
  store.dispatch(setError({ id, error }));
  const capturedError = store.getState().errors[id];
  expect(capturedError).toBeTruthy();

  // Set up an error handler from state like withErrorHandler().
  return new ErrorHandler({
    id,
    dispatch: sinon.stub(),
    capturedError,
  });
}

export const randomId = () => {
  // Add 1 to make sure it's never zero.
  return Math.floor(Math.random() * 10000) + 1;
};

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
      count: Object.keys(addons).length,
      results: Object.keys(addons),
      pageSize: coreApi.DEFAULT_API_PAGE_SIZE,
    }),
  );

  return { store };
}

export function createAddonsApiResult(results) {
  return {
    count: results.length,
    results,
  };
}

export function createFakeAutocompleteResult({
  name = 'suggestion-result',
  ...props
} = {}) {
  return {
    id: randomId(),
    icon_url: `${config.get('amoCDN')}/${name}.png`,
    name,
    promoted: null,
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
  count,
  pageSize = coreApi.DEFAULT_API_PAGE_SIZE,
} = {}) => {
  return {
    count: count || addons.length,
    page_size: pageSize,
    results: createFakeCollectionAddons({ addons }),
  };
};

const enabledExtension = Promise.resolve({
  isActive: true,
  isEnabled: true,
  type: ADDON_TYPE_EXTENSION,
});

export function getFakeAddonManagerWrapper({
  getAddon = enabledExtension,
  hasAddonManager = true,
  permissionPromptsEnabled = true,
  ...overrides
} = {}) {
  return {
    addChangeListeners: sinon.stub(),
    enable: sinon.stub().returns(Promise.resolve()),
    getAddon: sinon.stub().returns(getAddon),
    getAddonStatus,
    hasAddonManager: sinon.stub().returns(hasAddonManager),
    hasPermissionPromptsEnabled: sinon.stub().returns(permissionPromptsEnabled),
    install: sinon.stub().returns(Promise.resolve()),
    uninstall: sinon.stub().returns(Promise.resolve()),
    ...overrides,
  };
}

/*
 * A promise resolution callback for expecting rejected promises.
 *
 * For example:
 *
 * return somePromiseThatShouldFail()
 *   .then(unexpectedSuccess, (error) => {
 *     expect(error.message).toMatch(/the error/);
 *   });
 */
export function unexpectedSuccess() {
  return Promise.reject(new Error('The promise succeeded unexpectedly'));
}

export function JedSpy(data = {}) {
  const _Jed = new Jed(data);
  _Jed.gettext = sinon.spy(_Jed.gettext);
  _Jed.dgettext = sinon.spy(_Jed.gettext);
  _Jed.ngettext = sinon.spy(_Jed.ngettext);
  _Jed.dngettext = sinon.spy(_Jed.dngettext);
  _Jed.dpgettext = sinon.spy(_Jed.dpgettext);
  _Jed.npgettext = sinon.spy(_Jed.npgettext);
  _Jed.dnpgettext = sinon.spy(_Jed.dnpgettext);
  _Jed.sprintf = sinon.spy(_Jed.sprintf);
  return _Jed;
}

/*
 * Creates a stand-in for a jed instance,
 */
export function fakeI18n({
  lang = config.get('defaultLang'),
  includeJedSpy = true,
} = {}) {
  return makeI18n({}, lang, includeJedSpy ? JedSpy : undefined);
}

export const userAgentsByPlatform = {
  android: {
    firefox40Mobile: oneLine`Mozilla/5.0 (Android; Mobile; rv:40.0)
      Gecko/40.0 Firefox/40.0`,
    firefox40Tablet: oneLine`Mozilla/5.0 (Android; Tablet; rv:40.0)
      Gecko/40.0 Firefox/40.0`,
    firefox68: oneLine`Mozilla/5.0 (Android 9; Mobile; rv:68.0) Gecko/68.0
      Firefox/68.0`,
    firefox69: oneLine`Mozilla/5.0 (Android 9; Mobile; rv:69.0) Gecko/69.0
      Firefox/69.0`,
    firefox70: oneLine`Mozilla/5.0 (Android 9; Mobile; rv:70.0) Gecko/70.0
      Firefox/70.0`,
  },
  bsd: {
    firefox40FreeBSD: oneLine`Mozilla/5.0 (X11; FreeBSD amd64; rv:40.0)
      Gecko/20100101 Firefox/40.0`,
  },
  firefoxOS: {
    firefox26: 'Mozilla/5.0 (Mobile; rv:26.0) Gecko/26.0 Firefox/26.0',
  },
  ios: {
    firefox1iPad: oneLine`Mozilla/5.0 (iPad; CPU iPhone OS 8_3
      like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko)
      FxiOS/1.0 Mobile/12F69 Safari/600.1.4`,
    firefox1iPhone: oneLine`Mozilla/5.0 (iPhone; CPU iPhone OS 8_3
      like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko)
      FxiOS/1.0 Mobile/12F69n Safari/600.1.4`,
    firefox1iPodTouch: oneLine`Mozilla/5.0 (iPod touch; CPU iPhone
      OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko)
      FxiOS/1.0 Mobile/12F69 Safari/600.1.4`,
  },
  linux: {
    firefox10: oneLine`Mozilla/5.0 (X11; Linux i686; rv:10.0)
      Gecko/20100101 Firefox/10.0`,
    firefox57Ubuntu: oneLine`Mozilla/5.0 (X11; Ubuntu; Linux i686;
      rv:57.0) Gecko/20100101 Firefox/57.0`,
  },
  mac: {
    chrome41: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1)
      AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36`,
    firefox33: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10;
      rv:33.0) Gecko/20100101 Firefox/33.0`,
    firefox57: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:57.0)
      Gecko/20100101 Firefox/57.1`,
    firefox61: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:61.0)
      Gecko/20100101 Firefox/61.0`,
    firefox69: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:69.0)
      Gecko/20100101 Firefox/69.0`,
  },
  unix: {
    firefox51: oneLine`Mozilla/51.0.2 (X11; Unix x86_64; rv:29.0)
      Gecko/20170101 Firefox/51.0.2`,
  },
  windows: {
    firefox40: oneLine`Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0)
      Gecko/20100101 Firefox/40.1`,
  },
};

export const userAgents = {
  androidWebkit: [
    oneLine`Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K)
      AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`,
    oneLine`Mozilla/5.0 (Linux; U; Android 2.3.4; fr-fr; HTC Desire Build/GRJ22)
      AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`,
  ],
  chromeAndroid: [
    oneLine`Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C)
      AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile
      Safari/535.19`,
    oneLine`Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76K)
      AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile
      Safari/535.19`,
    oneLine`Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6P Build/MMB29P)
      AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile
      Safari/537.36`,
  ],
  chrome: [
    oneLine`Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko)
      Chrome/41.0.2228.0 Safari/537.36`,
    userAgentsByPlatform.mac.chrome41,
  ],
  firefox: [
    userAgentsByPlatform.linux.firefox10,
    userAgentsByPlatform.windows.firefox40,
    userAgentsByPlatform.mac.firefox33,
    'Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/31.0',
    // Firefox ESR 52
    oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:52.2.1)
      Gecko/20100101 Firefox/52.2.1`,
    userAgentsByPlatform.mac.firefox57,
  ],
  firefoxOS: [
    userAgentsByPlatform.firefoxOS.firefox26,
    'Mozilla/5.0 (Tablet; rv:26.0) Gecko/26.0 Firefox/26.0',
    'Mozilla/5.0 (TV; rv:44.0) Gecko/44.0 Firefox/44.0',
    'Mozilla/5.0 (Mobile; nnnn; rv:26.0) Gecko/26.0 Firefox/26.0',
  ],
  firefoxAndroid: [
    userAgentsByPlatform.android.firefox40Mobile,
    userAgentsByPlatform.android.firefox40Tablet,
    'Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0',
    'Mozilla/5.0 (Android 4.4; Tablet; rv:41.0) Gecko/41.0 Firefox/41.0',
    'Mozilla/5.0 (Android 4.4; Tablet; rv:57.0) Gecko/57.0 Firefox/57.0',
    userAgentsByPlatform.android.firefox69,
    userAgentsByPlatform.android.firefox70,
  ],
  firefoxIOS: [
    userAgentsByPlatform.ios.firefox1iPodTouch,
    userAgentsByPlatform.ios.firefox1iPhone,
    userAgentsByPlatform.ios.firefox1iPad,
  ],
};

export function apiResponsePage({
  count,
  next,
  previous,
  pageSize = coreApi.DEFAULT_API_PAGE_SIZE,
  results = [],
  ...customResponseParams
} = {}) {
  return {
    count: typeof count !== 'undefined' ? count : results.length,
    next,
    page_size: pageSize,
    previous,
    results,
    ...customResponseParams,
  };
}

/*
 * Repeatedly render a component tree using enzyme.shallow() until
 * finding and rendering TargetComponent.
 *
 * This is useful for testing a component wrapped in one or more
 * HOCs (higher order components).
 *
 * The `componentInstance` parameter is a React component instance.
 * Example: <MyComponent {...props} />
 *
 * The `TargetComponent` parameter is the React class (or function) that
 * you want to retrieve from the component tree.
 */
export function shallowUntilTarget(
  componentInstance,
  TargetComponent,
  { maxTries = 10, shallowOptions, _shallow = shallow } = {},
) {
  if (!componentInstance) {
    throw new Error('componentInstance parameter is required');
  }
  if (!TargetComponent) {
    throw new Error('TargetComponent parameter is required');
  }

  let root = _shallow(componentInstance, shallowOptions);

  if (typeof root.type() === 'string') {
    // If type() is a string then it's a DOM Node.
    // If it were wrapped, it would be a React component.
    throw new Error('Cannot unwrap this component because it is not wrapped');
  }

  for (let tries = 1; tries <= maxTries; tries++) {
    if (root.is(TargetComponent)) {
      // Now that we found the target component, render it.
      return root.shallow(shallowOptions);
    }
    // Unwrap the next component in the hierarchy.
    root = root.dive();
  }

  throw new Error(oneLine`Could not find ${TargetComponent} in rendered
    instance: ${componentInstance}; gave up after ${maxTries} tries`);
}

export function createFakeEvent(extraProps = {}) {
  return {
    currentTarget: sinon.stub(),
    preventDefault: sinon.stub(),
    stopPropagation: sinon.stub(),
    ...extraProps,
  };
}

export function generateHeaders(
  headerData = { 'Content-Type': 'application/json' },
) {
  return new Headers(headerData);
}

export function createApiResponse({
  textData = null,
  jsonData = {},
  ok = true,
  ...responseProps
} = {}) {
  let body = textData;
  let headers = generateHeaders({ 'Content-Type': 'text/plain' });

  if (!body && jsonData) {
    body = JSON.stringify(jsonData);
    headers = generateHeaders({ 'Content-Type': 'application/json' });
  }

  const response = new Response(body, {
    headers,
    status: ok ? 200 : 400,
    ...responseProps,
  });

  return Promise.resolve(response);
}

export function createFakeLanguageTool(otherProps = {}) {
  return {
    id: fakeAddon.id,
    current_version: fakeAddon.current_version,
    default_locale: 'en-US',
    guid: fakeAddon.guid,
    locale_disambiguation: '',
    name: fakeAddon.name,
    target_locale: 'ach',
    type: ADDON_TYPE_LANG,
    url: 'https://addons.allizom.org/en-US/firefox/addon/acholi-ug-lp-test',
    ...otherProps,
  };
}

export function createFakeAddonAbuseReport({
  addon = fakeAddon,
  message,
  reporter = null,
} = {}) {
  return {
    addon: {
      guid: addon.guid,
      id: addon.id,
      slug: addon.slug,
    },
    message,
    reporter,
  };
}

export function createFakeUserAbuseReport({
  message,
  reporter = null,
  user = createUserAccountResponse(),
} = {}) {
  return {
    message,
    reporter,
    user: {
      id: user.id,
      name: user.name,
      url: user.url,
      username: user.username,
    },
  };
}

// Returns a real-ish config object with custom parameters.
//
// Example:
//
// const fakeConfig = getFakeConfig({ isDevelopment: true });
// if (fakeConfig.get('isDevelopment')) {
//   ...
// }
export const getFakeConfig = (
  params = {},
  { allowUnknownKeys = false } = {},
) => {
  for (const key of Object.keys(params)) {
    if (!config.has(key) && !allowUnknownKeys) {
      // This will help alert us when a test accidentally relies
      // on an invalid config key.
      throw new Error(
        `Cannot set a fake value for "${key}"; this key is invalid`,
      );
    }
  }
  return Object.assign(config.util.cloneDeep(config), params);
};

/*
 * A sinon matcher to check if the URL contains the declared params.
 *
 * Example:
 *
 * mockWindow.expects('fetch').withArgs(urlWithTheseParams({ page: 1 }))
 */
export const urlWithTheseParams = (params) => {
  return sinon.match((urlString) => {
    const { query } = urllib.parse(urlString, true);

    for (const param in params) {
      if (
        query[param] === undefined ||
        query[param] !== params[param].toString()
      ) {
        return false;
      }
    }

    return true;
  }, `urlWithTheseParams(${JSON.stringify(params)})`);
};

/*
 * Returns a fake ReactRouter location object.
 *
 * See ReactRouterLocationType in 'core/types/router';
 */
export const createFakeLocation = (props = {}) => {
  return {
    action: 'PUSH',
    hash: '',
    key: 'some-key',
    pathname: '/some/url',
    query: {},
    search: '',
    ...props,
  };
};

/*
 * Returns a fake ReactRouter history object.
 *
 * See ReactRouterHistoryType in 'core/types/router';
 */
export const createFakeHistory = ({ location = createFakeLocation() } = {}) => {
  return {
    location,
    goBack: sinon.spy(),
    listen: sinon.spy(),
    push: sinon.stub(),
  };
};

/*
 * Returns a fake ClientCompatibilityType object.
 */
export const createFakeClientCompatibility = (props = {}) => {
  return {
    compatible: true,
    downloadUrl: DOWNLOAD_FIREFOX_BASE_URL,
    maxVersion: '2',
    minVersion: '1',
    reason: 'A fake reason',
    ...props,
  };
};

export const createContextWithFakeRouter = ({
  history = createFakeHistory(),
  location = history.location,
  match = {},
  ...overrides
} = {}) => {
  return {
    context: {
      router: {
        history,
        route: {
          location,
          match,
        },
      },
    },
    childContextTypes: {
      router: PropTypes.object.isRequired,
    },
    ...overrides,
  };
};

/*
 * Simulate how a component you depend on will invoke a callback.
 *
 * The return value is an executable callback that you can call
 * with the necessary arguments.
 *
 * type SimulateComponentCallbackParams = {|
 *   // This is the root of your parent component (an enzyme wrapper object).
 *   root: Object,
 *   // This is the component class you want to simulate.
 *   Component: React.Element<any>,
 *   // This is the property name for the callback.
 *   propName: string,
 * |};
 */
export const simulateComponentCallback = ({ Component, root, propName }) => {
  const component = root.find(Component);
  expect(component).toHaveProp(propName);

  const callback = component.prop(propName);
  expect(typeof callback).toEqual('function');

  return (...args) => {
    const result = callback(...args);

    // Since the component might call setState() and that would happen
    // outside of a standard React lifestyle hook, we have to re-render.
    root.update();

    return result;
  };
};

export const createUserNotificationsResponse = () => {
  return [
    {
      name: 'reply',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'new_features',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'upgrade_success',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'new_review',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'upgrade_fail',
      enabled: true,
      mandatory: true,
    },
    {
      name: 'reviewer_reviewed',
      enabled: true,
      mandatory: true,
    },
    {
      name: 'individual_contact',
      enabled: true,
      mandatory: true,
    },
    {
      name: 'announcements',
      enabled: false,
      mandatory: false,
    },
  ];
};

/*
 * Call this in a test after any shallowUntilTarget() component might
 * have adjusted its uiState.
 *
 * This simulates how Redux will update component props after
 * an action dispatch.
 * It's necessary because shallow Enzyme wrapper updates do not
 * propagate to all HOCs.
 */
export function applyUIStateChanges({ root, store }) {
  const rootProps = root.instance().props;
  const { uiStateID } = rootProps;
  invariant(
    uiStateID,
    'uiStateID cannot be undefined; was the component wrapped in withUIState()?',
  );

  const state = store.getState();

  if (selectUIState({ uiState: state.uiState, uiStateID }) === undefined) {
    throw new Error(
      'Cannot apply UI state changes because the component has not dispatched any setUIState() actions yet',
    );
  }

  const mapStateToProps = createUIStateMapper({
    // This value is never used. The state is always selected from the
    // Redux store.
    initialState: {},
    uiStateID,
  });
  const stateProps = mapStateToProps(state, rootProps);
  const mappedProps = mergeUIStateProps(
    stateProps,
    { dispatch: store.dispatch },
    rootProps,
  );

  root.setProps(mappedProps);
}

/*
 * Change a component's uiState.
 */
export function setUIState({ root, change, store }) {
  root.instance().props.setUIState(change);
  applyUIStateChanges({ root, store });
}

export function fakeCookies(overrides = {}) {
  return {
    addChangeListener: sinon.stub(),
    get: sinon.stub(),
    getAll: sinon.stub(),
    removeChangeListener: sinon.stub(),
    set: sinon.stub(),
    ...overrides,
  };
}

export const createFakeTracking = (overrides = {}) => {
  return {
    pageView: sinon.stub(),
    sendEvent: sinon.stub(),
    setDimension: sinon.stub(),
    setPage: sinon.stub(),
    ...overrides,
  };
};

// Save a reference to the real setTimeout in case a test uses a mock
// sinon clock.
const globalSetTimeout = setTimeout;

/*
 * Wait until the saga dispatches an action causing isMatch(action)
 * to return true, and return that action.
 * Throw an error if the action is not dispatched.
 *
 * This is helpful for when a saga dispatches the same action
 * but with differing payloads.
 *
 * For most cases you can probably just use sagaTester.waitFor() instead.
 */
export async function matchingSagaAction(
  sagaTester,
  isMatch,
  { maxTries = 50 } = {},
) {
  let calledActions = [];
  let foundAction;

  for (let attempt = 0; attempt < maxTries; attempt++) {
    calledActions = sagaTester.getCalledActions();
    foundAction = calledActions.find(isMatch);
    if (foundAction !== undefined) {
      break;
    }

    // Yield a tick to the saga.
    await new Promise((resolve) => globalSetTimeout(resolve, 1));
  }

  if (!foundAction) {
    throw new Error(
      `
      The matcher function did not return true:

      ${isMatch}

      The saga dispatched these action types: ${
        calledActions.map((action) => action.type).join(', ') || '(none at all)'
      }`,
    );
  }
  return foundAction;
}

export const getFakeLogger = (params = {}) => {
  return {
    debug: sinon.stub(),
    error: sinon.stub(),
    info: sinon.stub(),
    warn: sinon.stub(),
    ...params,
  };
};

// This simulates debounce() without any debouncing.
export function createFakeDebounce() {
  return sinon.spy((callback) => (...args) => callback(...args));
}

// This creates a fake instance with the same interface as
// LocalState in core/localState
export function createFakeLocalState(overrides = {}) {
  return {
    clear: sinon.spy(() => Promise.resolve()),
    load: sinon.spy(() => Promise.resolve(null)),
    save: sinon.spy(() => Promise.resolve()),
    ...overrides,
  };
}

// Return a string where all blank spaces are consistent across platforms.
export function normalizeSpaces(text) {
  // Specifically, this regex replaces `\u202F` -- a narrow,
  // non-breaking space -- with ' '. This is because the actual code point
  // may vary between platform and Node.JS version. More info:
  // https://www.fileformat.info/info/unicode/char/202f/index.htm
  return text ? text.replace(/\s/g, ' ') : text;
}

export const createFakeBlockResult = ({
  addonName = 'some-addon-name',
  guid = 'some-guid',
  reason = 'some reason',
  url = null,
  ...others
} = {}) => {
  return {
    id: 123,
    created: '2020-01-22T10:09:01Z',
    modified: '2020-01-22T10:09:01Z',
    guid,
    min_version: '0',
    max_version: '*',
    addon_name: addonName,
    reason,
    url,
    ...others,
  };
};

export const fakeEventData = Object.freeze({
  click: 'some-click-data',
  conversion: 'some-conversion-data',
});

export const fakeSponsoredShelf = Object.freeze({
  results: Array(6).fill({
    ...fakeAddon,
    event_data: fakeEventData,
  }),
  impression_data: 'some data',
  impression_url: 'https://mozilla.org/',
});
