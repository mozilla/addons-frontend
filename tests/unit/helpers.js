/* global Headers, window */
import urllib from 'url';

import PropTypes from 'prop-types';
import invariant from 'invariant';
import Jed from 'jed';
import UAParser from 'ua-parser-js';
import { oneLine } from 'common-tags';
import { createMemoryHistory } from 'history';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { LOCATION_CHANGE } from 'redux-first-history';
import { all, fork } from 'redux-saga/effects';
import {
  getDefaultNormalizer,
  render as libraryRender,
  screen as libraryScreen,
  within as libraryWithin,
} from '@testing-library/react';

import {
  DOWNLOAD_FIREFOX_BASE_URL,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  ENABLED,
  OS_ALL,
} from 'amo/constants';
import I18nProvider from 'amo/i18n/Provider';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  THEMES_BY_AUTHORS_PAGE_SIZE,
  loadAddonsByAuthors as defaultLoadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createInternalCollection } from 'amo/reducers/collections';
import { createInternalHomeShelves } from 'amo/reducers/home';
import createStore from 'amo/store';
import { addQueryParamsToHistory } from 'amo/utils';
import { createApiError } from 'amo/api/index';
import {
  setClientApp,
  setLang,
  setRegionCode,
  setAuthToken,
  setUserAgent,
} from 'amo/reducers/api';
import * as coreApi from 'amo/api';
import { getAddonStatus } from 'amo/addonManager';
import App from 'amo/components/App';
import { ErrorHandler } from 'amo/errorHandler';
import { makeI18n } from 'amo/i18n/utils';
import { createGroupedRatings, createInternalAddon } from 'amo/reducers/addons';
import {
  autocompleteLoad,
  autocompleteStart,
  createInternalSuggestion,
} from 'amo/reducers/autocomplete';
import { setError } from 'amo/reducers/errors';
import { searchLoad, searchStart } from 'amo/reducers/search';
import { loadCurrentUserAccount } from 'amo/reducers/users';
import { createInternalVersion } from 'amo/reducers/versions';
import defaultSagas from 'amo/sagas';
import { EXPERIMENT_COOKIE_NAME } from 'amo/withExperiment';
// eslint-disable-next-line import/default
import prodConfig from 'config/default';
import testConfig from 'config/test';

import {
  createUserAccountResponse as createUserAccountResponseNode,
  getFakeConfig as getFakeConfigNode,
  getFakeLogger as getFakeLoggerNode,
  userAuthSessionId as userAuthSessionIdNode,
} from './helpers_node';

export const DEFAULT_LANG_IN_TESTS = prodConfig.defaultLang;
export const sampleUserAgent =
  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1';
export const sampleUserAgentParsed = UAParser(sampleUserAgent);

export const createLocalizedString = (string, lang = DEFAULT_LANG_IN_TESTS) => {
  return string === null ? null : { [lang]: string };
};

export const fakePreview = Object.freeze({
  id: 1,
  caption: createLocalizedString('Image 1'),
  image_url: 'https://addons.mozilla.org/user-media/full/1.png',
  thumbnail_url: 'https://addons.mozilla.org/user-media/thumb/1.png',
  image_size: [400, 200],
  thumbnail_size: [200, 100],
});

export const fakeFile = Object.freeze({
  created: '2014-11-22T10:09:01Z',
  hash: 'a1b2c3d4',
  id: 57721,
  is_mozilla_signed_extension: false,
  host_permissions: ['*://example.com/*', '*://mozilla.com/*'],
  optional_permissions: ['*://developer.mozilla.org/*', 'bookmarks'],
  permissions: ['activeTab', 'webRequest'],
  platform: OS_ALL,
  size: 123,
  status: 'public',
  url: 'https://addons.mozilla.org/files/321/addon.xpi',
});

export const fakeAuthor = Object.freeze({
  id: 98811255,
  name: 'Krupa',
  picture_url: 'https://addons.mozilla.org/user-media/static/img/anon_user.png',
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
  file: fakeFile,
  id: 123,
  is_strict_compatibility_enabled: false,
  license: {
    is_custom: false,
    name: createLocalizedString('tofulicense'),
    url: 'http://license.com/',
  },
  release_notes: createLocalizedString('Some release notes'),
  reviewed: '2014-11-22T10:09:01Z',
  version: '2.0.0',
});

export const fakeAddon = Object.freeze({
  authors: [fakeAuthor],
  average_daily_users: 100,
  categories: ['other'],
  contributions_url: null,
  created: '2014-11-22T10:09:01Z',
  current_version: fakeVersion,
  description: createLocalizedString(
    'This is a longer description of the chill out add-on',
  ),
  default_locale: DEFAULT_LANG_IN_TESTS,
  edit_url: 'https://addons.m.o/addon/chill-out/edit',
  guid: '1234@my-addons.firefox',
  has_eula: true,
  has_privacy_policy: true,
  homepage: {
    'url': createLocalizedString('http://hamsterdance.com/'),
    'outgoing': createLocalizedString('https://outgoing.mozilla.org/hamster'),
  },
  id: 1234,
  icon_url: 'https://addons.mozilla.org/user-media/webdev-64.png',
  icons: {
    32: 'https://addons.mozilla.org/user-media/webdev-32.png',
    64: 'https://addons.mozilla.org/user-media/webdev-64.png',
    128: 'https://addons.mozilla.org/user-media/webdev-128.png',
  },
  is_disabled: false,
  is_experimental: false,
  is_source_public: true,
  is_noindexed: false,
  last_updated: '2018-11-22T10:09:01Z',
  name: createLocalizedString('Chill Out'),
  previews: [fakePreview],
  promoted: null,
  ratings: {
    average: 3.5,
    count: 10,
    grouped_counts: createGroupedRatings(),
    text_count: 5,
  },
  requires_payment: false,
  review_url: 'https://addons.m.o/en-US/editors/review/2377',
  slug: 'chill-out',
  status: 'public',
  summary: createLocalizedString('This is a summary of the chill out add-on'),
  support_email: null,
  support_url: {
    url: createLocalizedString('http://support.hampsterdance.com/'),
    outgoing: createLocalizedString(
      'https://outgoing.mozilla.org/supporthamster',
    ),
  },
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
  description: createLocalizedString('This is the add-on description'),
  guid: 'dancing-daisies-theme@my-addons.firefox',
  id: 54321,
  name: createLocalizedString('Dancing Daisies by MaDonna'),
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
  url: 'https://addons.mozilla.org/addon/detail/view',
});

export const fakeReview = Object.freeze({
  id: 8876,
  // The API only provides a minimal add-on representation.
  addon: {
    icon_url: 'https://addons.mozilla.org/user-media/webdev-64.png',
    id: 28014,
    name: createLocalizedString('fake add-on name'),
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

export const fakeExternalShelf = Object.freeze({
  title: createLocalizedString('Top Rated Themes'),
  url: 'https://addons-dev.allizom.org/api/v5/addons/search/?sort=rating&type=statictheme',
  endpoint: 'search',
  addon_type: ADDON_TYPE_STATIC_THEME,
  footer: {
    url: 'http://testserver/extensions/',
    text: createLocalizedString('See more top rated themes'),
    outgoing: '',
  },
  addons: [fakeAddon],
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

export const createFakeAddonInfo = ({
  eula = 'eula text',
  privacyPolicy = ' some privacy policy text',
} = {}) => {
  return {
    eula: createLocalizedString(eula),
    privacy_policy: createLocalizedString(privacyPolicy),
  };
};

export const fakePrimaryHeroShelfExternalAddon = Object.freeze({
  id: 1,
  guid: 'some-guid',
  homepage: {
    'url': createLocalizedString('http://hamsterdance.com/'),
    'outgoing': createLocalizedString('https://outgoing.mozilla.org/hamster'),
  },
  name: createLocalizedString('some external name'),
  type: ADDON_TYPE_EXTENSION,
});

export const createPrimaryHeroShelf = ({
  addon = undefined,
  description = 'Primary shelf description',
  external = undefined,
  featuredImage = 'https://addons.mozilla.org/static/img/hero/featured/teamaddons.jpg',
  gradient = { start: 'color-ink-80', end: 'color-blue-70' },
} = {}) => {
  return {
    addon,
    description: createLocalizedString(description),
    external:
      addon === undefined && external === undefined
        ? 'external-link'
        : external,
    featured_image: featuredImage,
    gradient,
  };
};

export const createSecondaryHeroShelf = ({
  cta = {
    url: 'https://mozilla.org',
    outgoing: 'https://outgoing/',
    text: 'Some cta text',
  },
  description = 'Secondary shelf description',
  headline = 'Secondary shelf headline',
  modules = [
    {
      icon: 'icon1',
      description: 'module 1 description',
      cta: {
        url: 'https://mozilla.org/1',
        outgoing: 'https://outgoing/1',
        text: 'module 1 cta text',
      },
    },
    {
      icon: 'icon2',
      description: 'module 2 description',
      cta: {
        url: 'https://mozilla.org/2',
        outgoing: 'https://outgoing/2',
        text: 'module 2 cta text',
      },
    },
    {
      icon: 'icon3',
      description: 'module 3 description',
      cta: {
        url: 'https://mozilla.org/3',
        outgoing: 'https://outgoing/3',
        text: 'module 3 cta text',
      },
    },
  ],
} = {}) => {
  return {
    cta: cta
      ? {
          url: cta.url,
          outgoing: cta.outgoing,
          text: createLocalizedString(cta.text),
        }
      : null,
    description: createLocalizedString(description),
    headline: createLocalizedString(headline),
    modules: modules.map((module) => {
      return {
        icon: module.icon,
        description: createLocalizedString(module.description),
        cta: module.cta
          ? {
              url: module.cta.url,
              outgoing: module.cta.outgoing,
              text: createLocalizedString(module.cta.text),
            }
          : null,
      };
    }),
  };
};

export const createHomeShelves = ({
  resultsProps = [fakeExternalShelf],
  primaryProps = {},
  secondaryProps = {},
} = {}) => {
  return {
    results: resultsProps || [fakeExternalShelf],
    primary: createPrimaryHeroShelf(primaryProps),
    secondary: createSecondaryHeroShelf(secondaryProps),
  };
};

export const createHistory = ({ initialEntries } = {}) => {
  return addQueryParamsToHistory({
    history: createMemoryHistory({
      initialEntries,
    }),
  });
};

export const onLocationChanged = ({ pathname, search = '' }) => {
  const history = createHistory({ initialEntries: [`${pathname}${search}`] });

  return {
    type: LOCATION_CHANGE,
    payload: { location: history.location, action: 'PUSH' },
  };
};

export const changeLocation = async ({
  history,
  pathname = '/',
  search = '',
} = {}) => {
  await act(async () => {
    history.push(`${pathname}${search}`);
  });
};

export function dispatchClientMetadata({
  store = createStore().store,
  clientApp = CLIENT_APP_ANDROID,
  lang = DEFAULT_LANG_IN_TESTS,
  regionCode = null,
  userAgent = sampleUserAgent,
  pathname = `/${lang}/${clientApp}/`,
  search = '',
} = {}) {
  store.dispatch(setClientApp(clientApp));
  store.dispatch(setLang(lang));
  store.dispatch(setRegionCode(regionCode));
  store.dispatch(setUserAgent(userAgent));

  // Simulate the behavior of `redux-first-history`.
  store.dispatch(onLocationChanged({ pathname, search }));

  return {
    store,
    state: store.getState(),
  };
}

export function dispatchClientMetadataWithSagas({
  sagas = defaultSagas,
  ...otherArgs
} = {}) {
  // Enable the sagas for this test.
  function* testSagas() {
    yield all(sagas.map((saga) => fork(saga)));
  }

  const { sagaMiddleware, store } = createStore();
  sagaMiddleware.run(testSagas);

  return dispatchClientMetadata({ store, ...otherArgs });
}

export const userAuthSessionId = userAuthSessionIdNode;

export const createUserAccountResponse = createUserAccountResponseNode;

export function createFakeErrorHandler({
  capturedError = null,
  id = 'create-fake-error-handler-id',
} = {}) {
  return new ErrorHandler({
    id,
    dispatch: jest.fn(),
    capturedError,
  });
}

export function createStubErrorHandler(capturedError = null) {
  return new ErrorHandler({
    id: 'create-stub-error-handler-id',
    dispatch: sinon.stub(),
    capturedError,
  });
}

export function createCapturedErrorHandler({
  code,
  detail = 'Unknown error',
  id = 'error-handler-id',
  status = 400,
  store = createStore().store,
}) {
  const error = createApiError({
    response: { status },
    apiURL: 'https://some/api/endpoint',
    jsonResponse: { code, detail },
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

export function dispatchSignInActionsWithStore({
  store,
  authToken = userAuthSessionId(),
  userId = 12345,
  userProps = {},
}) {
  store.dispatch(setAuthToken(authToken));
  store.dispatch(
    loadCurrentUserAccount({
      user: createUserAccountResponse({ id: userId, ...userProps }),
    }),
  );

  return store;
}

export function dispatchSignInActions({
  authToken = userAuthSessionId(),
  userId = 12345,
  userProps = {},
  ...otherArgs
} = {}) {
  const { store } = dispatchClientMetadata(otherArgs);
  dispatchSignInActionsWithStore({
    authToken,
    userId,
    userProps,
    store,
  });
  return {
    store,
    state: store.getState(),
  };
}

export const dispatchSearchResults = async ({
  addons = [fakeAddon, { ...fakeAddon, slug: 'some-other-slug' }],
  count,
  filters = { query: 'test' },
  pageSize = coreApi.DEFAULT_API_PAGE_SIZE,
  store = dispatchClientMetadata().store,
  pageCount,
} = {}) => {
  await act(async () =>
    store.dispatch(
      searchStart({
        errorHandlerId: createStubErrorHandler().id,
        filters,
      }),
    ),
  );

  await act(async () =>
    store.dispatch(
      searchLoad({
        count: count || Object.keys(addons).length,
        results: addons,
        pageSize,
        pageCount,
      }),
    ),
  );

  return { store };
};

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
    icon_url: `https://addons.mozilla.org/${name}.png`,
    name: createLocalizedString(name),
    promoted: null,
    url: `https://example.org/en-US/firefox/addons/${name}/`,
    ...props,
  };
}

export function createFakeAddon({
  file = fakeAddon.current_version.file,
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
      file: {
        ...fakeAddon.current_version.file,
        ...file,
      },
      is_strict_compatibility_enabled,
    },
    ...overrides,
  };
}

export const dispatchAutocompleteResults = async ({
  filters = { query: 'test' },
  store = dispatchClientMetadata({ lang: DEFAULT_LANG_IN_TESTS }).store,
  results = [],
} = {}) => {
  await act(async () =>
    store.dispatch(
      autocompleteStart({
        errorHandlerId: createStubErrorHandler().id,
        filters,
      }),
    ),
  );
  await act(async () => store.dispatch(autocompleteLoad({ results })));
  return { store };
};

export const createFakeCollectionDetail = ({
  name = 'My Addons',
  count = 123,
  authorId = 99999,
  authorName = 'John Doe',
  authorUsername = 'johndoe',
  description = 'collection description',
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
    default_locale: DEFAULT_LANG_IN_TESTS,
    description: createLocalizedString(description),
    id: randomId(),
    modified: Date.now(),
    name: createLocalizedString(name),
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
  return { addon, notes: createLocalizedString(notes) };
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
  count,
  pageSize = coreApi.DEFAULT_API_PAGE_SIZE,
  addons = Array(pageSize).fill(createFakeCollectionAddon()),
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
  ...overrides
} = {}) {
  return {
    addChangeListeners: jest.fn(),
    enable: jest.fn().mockReturnValue(Promise.resolve()),
    getAddon: jest.fn().mockReturnValue(getAddon),
    getAddonStatus,
    hasAddonManager: jest.fn().mockReturnValue(hasAddonManager),
    install: jest.fn().mockReturnValue(Promise.resolve()),
    uninstall: jest.fn().mockReturnValue(Promise.resolve()),
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
  _Jed.gettext = jest.fn(_Jed.gettext);
  _Jed.dgettext = jest.fn(_Jed.gettext);
  _Jed.ngettext = jest.fn(_Jed.ngettext);
  _Jed.dngettext = jest.fn(_Jed.dngettext);
  _Jed.dpgettext = jest.fn(_Jed.dpgettext);
  _Jed.npgettext = jest.fn(_Jed.npgettext);
  _Jed.dnpgettext = jest.fn(_Jed.dnpgettext);
  _Jed.sprintf = jest.fn(_Jed.sprintf);
  return _Jed;
}

/*
 * Creates a stand-in for a jed instance,
 */
export function fakeI18n({
  lang = DEFAULT_LANG_IN_TESTS,
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
    firefox136: oneLine`Mozilla/5.0 (Android 15; Mobile; rv:136.0) Gecko/136.0
      Firefox/136.0`,
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
    firefox128: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:128.0)
      Gecko/20100101 Firefox/128.0`,
    firefox136: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:136.0)
      Gecko/20100101 Firefox/136.0`,
  },
  unix: {
    firefox51: oneLine`Mozilla/51.0.2 (X11; Unix x86_64; rv:29.0)
      Gecko/20170101 Firefox/51.0.2`,
  },
  windows: {
    firefox40: oneLine`Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0)
      Gecko/20100101 Firefox/40.1`,
    firefox115: oneLine`Mozilla/5.0 (Windows NT 6.1; WOW64; rv:115.0)
      Gecko/20100101 Firefox/115.0`,
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

export function createFakeLanguageTool({
  name = 'My addon',
  lang = DEFAULT_LANG_IN_TESTS,
  target_locale = '',
  ...props
} = {}) {
  return {
    id: fakeAddon.id,
    current_version: fakeAddon.current_version,
    default_locale: DEFAULT_LANG_IN_TESTS,
    guid: fakeAddon.guid,
    locale_disambiguation: '',
    name: createLocalizedString(name, lang),
    target_locale,
    type: ADDON_TYPE_LANG,
    url: 'https://addons.allizom.org/en-US/firefox/addon/acholi-ug-lp-test',
    ...props,
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

export function createFakeCollectionAbuseReport({
  collectionId,
  message = '',
  reason = 'other',
  reporter = null,
  reporterName = null,
  reporterEmail = null,
} = {}) {
  return {
    message,
    reason,
    reporter,
    reporter_name: reporterName,
    reporter_email: reporterEmail,
    collection: {
      id: collectionId,
    },
  };
}
export const getFakeConfig = getFakeConfigNode;

export const getMockConfig = (overrides = {}) => {
  return { ...prodConfig, ...testConfig, ...overrides };
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
 * See ReactRouterLocationType in 'amo/types/router';
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
 * See ReactRouterHistoryType in 'amo/types/router';
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

export function fakeCookies(overrides = {}) {
  return {
    addChangeListener: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    removeChangeListener: jest.fn(),
    set: jest.fn(),
    ...overrides,
  };
}

export const createFakeTracking = (overrides = {}) => {
  return {
    pageView: jest.fn(),
    sendEvent: jest.fn(),
    setDimension: jest.fn(),
    setPage: jest.fn(),
    setUserProperties: jest.fn(),
    ...overrides,
  };
};

export const createFakeLocalStorage = (overrides = {}) => {
  return {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
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
    // eslint-disable-next-line no-promise-executor-return
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

export const getFakeLogger = getFakeLoggerNode;

export const getFakeLoggerWithJest = (params = {}) => {
  return {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    ...params,
  };
};

// This simulates debounce() without any debouncing.
export function createFakeDebounce() {
  return jest.fn(
    (callback) =>
      (...args) =>
        callback(...args),
  );
}

// This creates a fake instance with the same interface as
// LocalState in amo/localState
export function createFakeLocalState(overrides = {}) {
  return {
    clear: jest.fn(() => Promise.resolve()),
    load: jest.fn(() => Promise.resolve(null)),
    save: jest.fn(() => Promise.resolve()),
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
    blocked: ['0.1', '4.56'],
    soft_blocked: [],
    is_all_versions: false,
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

export const createInternalAddonWithLang = (
  addon,
  lang = DEFAULT_LANG_IN_TESTS,
) => {
  const internalAddon = createInternalAddon(addon, lang);
  if (addon.notes) {
    internalAddon.notes = addon.notes;
  }
  return internalAddon;
};

export const createInternalVersionWithLang = (
  version,
  lang = DEFAULT_LANG_IN_TESTS,
) => {
  return createInternalVersion(version, lang);
};

export const createInternalHomeShelvesWithLang = (
  homeShelves,
  lang = DEFAULT_LANG_IN_TESTS,
) => {
  return createInternalHomeShelves(homeShelves, lang);
};

export const createInternalCollectionWithLang = ({
  addonsResponse,
  detail,
  lang = DEFAULT_LANG_IN_TESTS,
}) => {
  return createInternalCollection({
    addonsResponse,
    detail,
    lang,
  });
};

export const createInternalSuggestionWithLang = (
  suggestion,
  lang = DEFAULT_LANG_IN_TESTS,
) => {
  return createInternalSuggestion(suggestion, lang);
};

export const createFailedErrorHandler = ({
  error = new Error(),
  id = 'some-error-handler-id',
  message = 'An error message',
  store,
}) => {
  invariant(store, 'store must be passed into createFailedErrorHandler');
  const errorHandler = new ErrorHandler({
    dispatch: store.dispatch,
    id,
  });
  errorHandler.handle(error);
  errorHandler.addMessage(message);
  return errorHandler;
};

export const fakeTrackingEvent = Object.freeze({
  action: 'some-action',
  category: 'some-category',
  label: 'some-label',
  value: 19,
});

export const makeExperimentId = (id) => `20210219_amo_${id}`;

export const createExperimentData = ({
  id = makeExperimentId('some-id'),
  variantId = 'some-variant-id',
}) => {
  return { [id]: variantId };
};

/* eslint-disable testing-library/no-node-access */
const queryAllByClassName = (container, className) => {
  return container.querySelectorAll(`.${className}`);
};

const queryAllByTagName = (container, tagName) => {
  return container.getElementsByTagName(tagName);
};

const getAllByFeature = (container, queryFunction, value) => {
  const elements = queryFunction(container, value);
  if (elements.length) {
    return elements;
  }
  throw new Error('getAllByFeature returned no elements.');
};

const queryByFeature = (container, queryFunction, value) => {
  const elements = queryFunction(container, value);
  if (!elements.length) {
    return null;
  }
  if (elements.length === 1) {
    return elements[0];
  }
  throw new Error('queryByFeature returned more than one element.');
};

const getByFeature = (container, queryFunction, value) => {
  const element = queryFunction(container, value);
  if (!element) {
    throw new Error('getByFeature did not return any elements.');
  }
  return element;
};

export const getAllByClassName = (container, className) => {
  return getAllByFeature(container, queryAllByClassName, className);
};

export const getAllByTagName = (container, tagName) => {
  return getAllByFeature(container, queryAllByTagName, tagName);
};

const queryByClassName = (container, className) => {
  return queryByFeature(container, queryAllByClassName, className);
};

const queryByTagName = (container, tagName) => {
  return queryByFeature(container, queryAllByTagName, tagName);
};

const getByClassName = (container, className) => {
  return getByFeature(container, queryByClassName, className);
};

const getByTagName = (container, tagName) => {
  return getByFeature(container, queryByTagName, tagName);
};

const customQueries = (element) => {
  return {
    'getAllByClassName': getAllByClassName.bind(null, element),
    'getAllByTagName': getAllByTagName.bind(null, element),
    'queryAllByClassName': queryAllByClassName.bind(null, element),
    'queryAllByTagName': queryAllByTagName.bind(null, element),
    'getByClassName': getByClassName.bind(null, element),
    'getByTagName': getByTagName.bind(null, element),
    'queryByClassName': queryByClassName.bind(null, element),
    'queryByTagName': queryByTagName.bind(null, element),
  };
};

export const screen = {
  ...libraryScreen,
  ...customQueries(document.body),
};

const getByTextAcrossTags = (text) => {
  return screen.getByText(
    (content, element) => {
      const hasText = (el) => el.textContent === text;
      const elementHasText = hasText(element);
      const childrenDontHaveText = Array.from(element?.children || []).every(
        (child) => !hasText(child),
      );
      return elementHasText && childrenDontHaveText;
    },
    {
      normalizer: getDefaultNormalizer({ trim: false }),
    },
  );
};
screen.getByTextAcrossTags = getByTextAcrossTags;

export const within = (element) => {
  return {
    ...libraryWithin(element),
    ...customQueries(element),
    getByTextAcrossTags,
  };
};

export const getElements = (selector) => {
  return document.querySelectorAll(selector);
};
export const getElement = (selector) => getElements(selector)[0];

export const render = (ui, options = {}) => {
  const i18n = options.i18n || fakeI18n();
  const history =
    options.history ||
    createHistory({
      initialEntries: options.initialEntries || ['/'],
    });
  const store = options.store || dispatchClientMetadata().store;
  if (options.initialEntries) {
    // We need to update the router state with the initial entry.
    const parts = options.initialEntries[0].split('?');
    store.dispatch(
      onLocationChanged({
        pathname: parts[0],
        search: parts.length > 1 ? `?${parts[1]}` : '',
      }),
    );
  }

  const wrapper = ({ children }) => {
    return (
      <I18nProvider i18n={i18n}>
        <Provider store={store}>
          <Router history={history}>{children}</Router>
        </Provider>
      </I18nProvider>
    );
  };

  const result = libraryRender(ui, { wrapper });
  return { ...result, history, root: result.container.firstChild };
};
/* eslint-enable testing-library/no-node-access */

// This is used to mock window.matchMedia.
export const mockMatchMedia = {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
};

export const renderPage = (options = {}) => {
  // window.scrollTo isn't provided by jsdom, so we need to mock it.
  window.scrollTo = jest.fn();

  // Render the App component, which will use the location from options to
  // render the correct page.
  return render(<App />, options);
};

export const getSearchErrorHandlerId = (page) =>
  `src/amo/components/Search/index.js-${page}`;

export const fakeAuthors = [
  { ...fakeAuthor, name: 'Bob', username: 'bsilverberg', id: 1 },
  { ...fakeAuthor, name: 'Matt', username: 'tofumatt', id: 2 },
];

export const loadAddonsByAuthors = ({
  addonName = 'Some add-on name',
  addonType = ADDON_TYPE_EXTENSION,
  count = null,
  forAddonSlug = 'some-slug',
  multipleAuthors = false,
  store,
}) => {
  const pageSize =
    addonType === ADDON_TYPE_STATIC_THEME
      ? THEMES_BY_AUTHORS_PAGE_SIZE
      : EXTENSIONS_BY_AUTHORS_PAGE_SIZE;

  const addons = [];
  const totalAddons = typeof count === 'number' ? count : pageSize;

  for (let i = 0; i < totalAddons; i++) {
    addons.push({
      ...fakeAddon,
      id: i + 1,
      name: createLocalizedString(`${addonName}-${i}`),
      slug: `foo${i}`,
      type: addonType,
      authors: [fakeAuthors[0]],
    });
  }

  store.dispatch(
    defaultLoadAddonsByAuthors({
      addons,
      addonType,
      authorIds: multipleAuthors
        ? [fakeAuthors[0].id, fakeAuthors[1].id]
        : [fakeAuthors[0].id],
      count: addons.length,
      forAddonSlug,
      pageSize,
    }),
  );
};

// Write a cookie that will be read by withExperiment to enable an experiment.
export const createExperimentCookie = ({ experimentId, variant }) => {
  const cookieContent = JSON.stringify(
    createExperimentData({
      id: experimentId,
      variantId: variant,
    }),
  );
  document.cookie = `${EXPERIMENT_COOKIE_NAME}=${cookieContent}; path=/`;
};
