/* @flow */
import invariant from 'invariant';
import { oneLine } from 'common-tags';

import { LOAD_ADDONS_BY_AUTHORS } from 'amo/reducers/addonsByAuthors';
import {
  LOAD_COLLECTION_ADDONS,
  LOAD_CURRENT_COLLECTION,
  LOAD_CURRENT_COLLECTION_PAGE,
} from 'amo/reducers/collections';
import { LOAD_HOME_DATA } from 'amo/reducers/home';
import { LOAD_LANDING } from 'amo/reducers/landing';
import { LOAD_RECOMMENDATIONS } from 'amo/reducers/recommendations';
import {
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import log from 'core/logger';
import { LOAD_ADDON } from 'core/reducers/addons';
import { SET_LANG } from 'core/reducers/api';
import { SEARCH_LOADED } from 'core/reducers/search';
import { selectLocalizedContent } from 'core/reducers/utils';
import { findFileForPlatform } from 'core/utils';
import { formatFilesize } from 'core/i18n/utils';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { AddonStatusType } from 'core/types/addons';
import type { LocalizedString } from 'core/types/api';
import type { I18nType } from 'core/types/i18n';

export const FETCH_VERSION: 'FETCH_VERSION' = 'FETCH_VERSION';
export const FETCH_VERSIONS: 'FETCH_VERSIONS' = 'FETCH_VERSIONS';
export const LOAD_VERSIONS: 'LOAD_VERSIONS' = 'LOAD_VERSIONS';

export type VersionIdType = number;

export type AddonFileType = {|
  created: string,
  hash: string,
  id: number,
  is_mozilla_signed_extension: boolean,
  is_restart_required: boolean,
  is_webextension: boolean,
  optional_permissions: Array<string>,
  permissions: Array<string>,
  platform: 'all' | 'android' | 'mac' | 'linux' | 'windows',
  size: number,
  status: AddonStatusType,
  url: string,
|};

export type PlatformFilesType = {|
  all: ?AddonFileType,
  android: ?AddonFileType,
  mac: ?AddonFileType,
  linux: ?AddonFileType,
  windows: ?AddonFileType,
|};

export type AddonCompatibilityType = {|
  [appName: string]: {|
    min: string,
    max: string,
  |},
|};

export type PartialExternalAddonVersionType = {|
  channel: string,
  compatibility: AddonCompatibilityType,
  edit_url: string,
  files: Array<AddonFileType>,
  id: number,
  is_strict_compatibility_enabled: boolean,
  reviewed: Date,
  // This is the developer-defined version number.
  // It could, for example, be set to "0".
  // See:
  // https://github.com/mozilla/addons-frontend/pull/3271#discussion_r142159199
  version: string,
|};

type PartialExternalVersionLicenseType = {|
  name: LocalizedString | null,
  text?: LocalizedString,
  url: string,
|};

export type ExternalVersionLicenseType = {|
  ...PartialExternalVersionLicenseType,
  is_custom: boolean,
|};

type PartialVersionLicenseType = {|
  name: string | null,
  text?: string,
  url: string,
|};

export type VersionLicenseType = {|
  ...PartialVersionLicenseType,
  isCustom: boolean,
|};

export type ExternalAddonVersionType = {|
  ...PartialExternalAddonVersionType,
  license: ExternalVersionLicenseType,
  release_notes?: LocalizedString,
|};

export type AddonVersionType = {
  compatibility: AddonCompatibilityType,
  id: VersionIdType,
  isStrictCompatibilityEnabled: boolean,
  license: VersionLicenseType | null,
  platformFiles: PlatformFilesType,
  releaseNotes?: string,
  version: string,
};

export type VersionsState = {
  byId: {
    [id: number]: AddonVersionType,
  },
  bySlug: {
    [slug: string]: {
      versionIds: Array<VersionIdType> | null,
      loading: boolean,
    },
  },
  lang: string,
};

export const initialState: VersionsState = {
  byId: {},
  bySlug: {},
  lang: '',
};

export const defaultPlatformFiles: PlatformFilesType = Object.freeze({
  [OS_ALL]: undefined,
  [OS_ANDROID]: undefined,
  [OS_LINUX]: undefined,
  [OS_MAC]: undefined,
  [OS_WINDOWS]: undefined,
});

export const createPlatformFiles = (
  version?: ExternalAddonVersionType | PartialExternalAddonVersionType,
): PlatformFilesType => {
  const platformFiles = { ...defaultPlatformFiles };

  if (version && version.files.length > 0) {
    version.files.forEach((file) => {
      // eslint-disable-next-line no-prototype-builtins
      if (!platformFiles.hasOwnProperty(file.platform)) {
        // You wouldn't think this is needed, but Flow.
        invariant(version, 'version is required');
        log.warn(oneLine`A version with id ${version.id}
          has a file with an unknown platform: ${file.platform}`);
      }
      platformFiles[file.platform] = file;
    });
  }
  return platformFiles;
};

export const createInternalVersion = (
  version: ExternalAddonVersionType,
  lang: string,
): AddonVersionType => {
  return {
    compatibility: version.compatibility,
    id: version.id,
    isStrictCompatibilityEnabled: Boolean(
      version.is_strict_compatibility_enabled,
    ),
    license: version.license
      ? {
          isCustom: version.license.is_custom,
          name: selectLocalizedContent(version.license.name, lang),
          text: selectLocalizedContent(version.license.text, lang),
          url: version.license.url,
        }
      : null,
    platformFiles: createPlatformFiles(version),
    releaseNotes: selectLocalizedContent(version.release_notes, lang),
    version: version.version,
  };
};

type FetchVersionParams = {|
  errorHandlerId: string,
  slug: string,
  versionId: VersionIdType,
|};

export type FetchVersionAction = {|
  type: typeof FETCH_VERSION,
  payload: FetchVersionParams,
|};

export const fetchVersion = ({
  errorHandlerId,
  slug,
  versionId,
}: FetchVersionParams): FetchVersionAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(slug, 'slug is required');
  invariant(versionId, 'versionId is required');

  return {
    type: FETCH_VERSION,
    payload: { errorHandlerId, slug, versionId },
  };
};

type FetchVersionsParams = {|
  errorHandlerId: string,
  page?: string,
  slug: string,
|};

export type FetchVersionsAction = {|
  type: typeof FETCH_VERSIONS,
  payload: FetchVersionsParams,
|};

export const fetchVersions = ({
  errorHandlerId,
  page = '1',
  slug,
}: FetchVersionsParams): FetchVersionsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(slug, 'slug is required');

  return {
    type: FETCH_VERSIONS,
    payload: { errorHandlerId, page, slug },
  };
};

type LoadVersionsParams = {|
  slug: string,
  versions: Array<ExternalAddonVersionType>,
|};

type LoadVersionsAction = {|
  type: typeof LOAD_VERSIONS,
  payload: LoadVersionsParams,
|};

export const loadVersions = ({
  slug,
  versions,
}: LoadVersionsParams = {}): LoadVersionsAction => {
  invariant(slug, 'slug is required');
  invariant(versions, 'versions is required');

  return {
    type: LOAD_VERSIONS,
    payload: { slug, versions },
  };
};

type GetVersionByIdParams = {|
  id: VersionIdType,
  state: VersionsState,
|};

export const getVersionById = ({
  id,
  state,
}: GetVersionByIdParams): AddonVersionType | null => {
  invariant(id, 'id is required');
  invariant(state, 'state is required');

  const version = state.byId[id];
  return version || null;
};

type GetBySlugParams = {|
  slug: string,
  state: VersionsState,
|};

export const getVersionsBySlug = ({
  slug,
  state,
}: GetBySlugParams): Array<AddonVersionType> | null => {
  invariant(slug, 'slug is required');
  invariant(state, 'state is required');

  const infoForSlug = state.bySlug[slug];
  if (infoForSlug && infoForSlug.versionIds) {
    return infoForSlug.versionIds.map((versionId) => {
      const version = getVersionById({ id: versionId, state });
      invariant(
        version,
        `missing version for slug ${slug} and versionId ${versionId}`,
      );
      return version;
    });
  }
  return null;
};

export const getLoadingBySlug = ({ slug, state }: GetBySlugParams): boolean => {
  invariant(slug, 'slug is required');
  invariant(state, 'state is required');

  const infoForSlug = state.bySlug[slug];
  return Boolean(infoForSlug && infoForSlug.loading);
};

export type VersionInfoType = {|
  compatibilityString: string,
  created: string | null,
  filesize: string | null,
|};

type GetVersionInfoParams = {|
  _findFileForPlatform?: typeof findFileForPlatform,
  i18n: I18nType,
  state: VersionsState,
  userAgentInfo: UserAgentInfoType,
  versionId: VersionIdType,
|};

export const getVersionInfo = ({
  _findFileForPlatform = findFileForPlatform,
  i18n,
  state,
  userAgentInfo,
  versionId,
}: GetVersionInfoParams): VersionInfoType | null => {
  const version = getVersionById({ id: versionId, state });

  if (version) {
    const file = _findFileForPlatform({
      platformFiles: version.platformFiles,
      userAgentInfo,
    });

    // translators: This is application compatibility information, such as "firefox 41 and later"
    const noMaxString = i18n.gettext(
      '%(application)s %(minVersion)s and later',
    );
    // translators: This is application compatibility information, such as "firefox 41 to 45"
    const maxAndMinString = i18n.gettext(
      '%(application)s %(minVersion)s to %(maxVersion)s',
    );
    const appInfo = Object.keys(version.compatibility)
      .map((application) => {
        const { max, min } = version.compatibility[application];
        if (max === '*') {
          return i18n.sprintf(noMaxString, { application, minVersion: min });
        }
        return i18n.sprintf(maxAndMinString, {
          application,
          maxVersion: max,
          minVersion: min,
        });
      })
      .join(', ');

    const compatibilityString = i18n.sprintf(
      // eslint-disable-next-line max-len
      // translators: This contains a comma-delimited list of applications and versions, such as "android 41 and later, firefox 42 and later"
      i18n.gettext('Works with %(listOfApplicatonsAndVersions)s'),
      { listOfApplicatonsAndVersions: appInfo },
    );

    return {
      compatibilityString,
      created: file ? file.created : null,
      filesize: file ? formatFilesize({ i18n, size: file.size }) : null,
    };
  }

  return null;
};

type Action = FetchVersionAction | FetchVersionsAction | LoadVersionsAction;

const reducer = (
  state: VersionsState = initialState,
  action: Action,
): VersionsState => {
  switch (action.type) {
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };
    case FETCH_VERSION:
    case FETCH_VERSIONS: {
      const { slug } = action.payload;
      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [slug]: {
            versionIds: null,
            loading: true,
          },
        },
      };
    }

    case LOAD_VERSIONS: {
      const { slug, versions } = action.payload;

      const newVersions = {};
      for (const version of versions) {
        newVersions[version.id] = createInternalVersion(version, state.lang);
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          ...newVersions,
        },
        bySlug: {
          ...state.bySlug,
          [slug]: {
            versionIds: versions.map((version) => version.id),
            loading: false,
          },
        },
      };
    }

    case LOAD_ADDON:
      // This is needed to use a common logic to store add-ons.
      //
      // eslint-disable-next-line no-param-reassign
      action.payload.addons = [action.payload.addon];
    // Also, we don't use `break` in this case block on purpose.
    //
    // eslint-disable-next-line no-fallthrough
    case LOAD_ADDONS_BY_AUTHORS:
    case LOAD_COLLECTION_ADDONS:
    case LOAD_CURRENT_COLLECTION:
    case LOAD_CURRENT_COLLECTION_PAGE:
    case LOAD_RECOMMENDATIONS:
    case SEARCH_LOADED: {
      const { addons, addonsResponse, results } = action.payload;

      let items;
      if (results) {
        items = results;
      } else if (addonsResponse) {
        items = addonsResponse.results;
      } else {
        items = addons.results || addons;
      }

      const newVersions = {};
      for (const addon of items) {
        // For collection related actions, the addon is available in addon.addon.
        const addonToUse = addon.addon || addon;
        if (addonToUse.current_version) {
          const apiVersion = addonToUse.current_version;

          const version = createInternalVersion(apiVersion, state.lang);

          // Do not overwrite licence and release_notes data with nulls, which
          // are omitted from some API responses.
          if (!apiVersion.license || !apiVersion.release_notes) {
            const existingVersion = getVersionById({
              id: apiVersion.id,
              state,
            });
            if (existingVersion) {
              version.license = version.license || existingVersion.license;
              version.releaseNotes =
                version.releaseNotes || existingVersion.releaseNotes;
            }
          }

          newVersions[version.id] = version;
        }
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          ...newVersions,
        },
      };
    }

    case LOAD_HOME_DATA: {
      const { collections, shelves } = action.payload;

      const newVersions = {};
      for (const shelf of Object.keys(shelves)) {
        if (shelves[shelf]) {
          for (const addon of shelves[shelf].results) {
            if (addon.current_version) {
              const currentVersion = addon.current_version;
              let version = createInternalVersion(currentVersion, state.lang);
              // license and release_notes are omitted from the search endpoint results,
              // use them from an existing version if available.
              const { id } = currentVersion;
              const existingVersion = getVersionById({ id, state });
              if (existingVersion) {
                version = {
                  ...version,
                  license: existingVersion.license,
                  releaseNotes: existingVersion.releaseNotes,
                };
              }
              newVersions[id] = version;
            }
          }
        }
      }

      for (const collection of collections) {
        if (collection && collection.results) {
          for (const addon of collection.results) {
            const version = createInternalVersion(
              addon.addon.current_version,
              state.lang,
            );
            newVersions[version.id] = version;
          }
        }
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          ...newVersions,
        },
      };
    }

    case LOAD_LANDING: {
      const { recommended, highlyRated, trending } = action.payload;

      const newVersions = {};
      for (const apiResponse of [recommended, highlyRated, trending]) {
        for (const addon of apiResponse.results) {
          if (addon.current_version) {
            const version = createInternalVersion(
              addon.current_version,
              state.lang,
            );
            newVersions[version.id] = version;
          }
        }
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          ...newVersions,
        },
      };
    }

    default:
      return state;
  }
};

export default reducer;
