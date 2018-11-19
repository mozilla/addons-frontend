/* @flow */
import invariant from 'invariant';
import { oneLine } from 'common-tags';

import { LOAD_ADDONS_BY_AUTHORS } from 'amo/reducers/addonsByAuthors';
import {
  LOAD_COLLECTION_ADDONS,
  LOAD_CURRENT_COLLECTION,
  LOAD_CURRENT_COLLECTION_PAGE,
} from 'amo/reducers/collections';
import { LOAD_HOME_ADDONS } from 'amo/reducers/home';
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
import { LOAD_ADDON_RESULTS } from 'core/reducers/addons';
import { SEARCH_LOADED } from 'core/reducers/search';
import { findFileForPlatform } from 'core/utils';
import type { UserAgentInfoType } from 'core/reducers/api';
import type {
  AddonCompatibilityType,
  ExternalAddonVersionType,
  PlatformFilesType,
  PartialExternalAddonVersionType,
} from 'core/types/addons';

export const FETCH_VERSIONS: 'FETCH_VERSIONS' = 'FETCH_VERSIONS';
export const LOAD_VERSIONS: 'LOAD_VERSIONS' = 'LOAD_VERSIONS';

export type VersionIdType = number;

export type AddonVersionType = {
  compatibility?: AddonCompatibilityType,
  id: VersionIdType,
  isStrictCompatibilityEnabled: boolean,
  license: { name: string, url: string } | null,
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
};

export const initialState: VersionsState = {
  byId: {},
  bySlug: {},
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
): AddonVersionType => {
  return {
    compatibility: version.compatibility,
    id: version.id,
    isStrictCompatibilityEnabled: Boolean(
      version.is_strict_compatibility_enabled,
    ),
    license: version.license
      ? { name: version.license.name, url: version.license.url }
      : null,
    platformFiles: createPlatformFiles(version),
    releaseNotes: version.release_notes,
    version: version.version,
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

type VersionInfoType = {|
  created?: string,
  filesize?: number,
|};

type GetVersionInfoParams = {|
  _findFileForPlatform?: typeof findFileForPlatform,
  state: VersionsState,
  userAgentInfo: UserAgentInfoType,
  versionId: VersionIdType,
|};

export const getVersionInfo = ({
  _findFileForPlatform = findFileForPlatform,
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

    if (file) {
      return {
        created: file.created,
        filesize: file.size,
      };
    }
  }

  return null;
};

type Action = FetchVersionsAction | LoadVersionsAction;

const reducer = (
  state: VersionsState = initialState,
  action: Action,
): VersionsState => {
  switch (action.type) {
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
        newVersions[version.id] = createInternalVersion(version);
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

    case LOAD_ADDONS_BY_AUTHORS:
    case LOAD_ADDON_RESULTS:
    case LOAD_COLLECTION_ADDONS:
    case LOAD_CURRENT_COLLECTION:
    case LOAD_CURRENT_COLLECTION_PAGE:
    case LOAD_RECOMMENDATIONS:
    case SEARCH_LOADED: {
      const { addons, results } = action.payload;

      const items = addons || results;
      const newVersions = {};
      for (const addon of items) {
        // For collection related actions, the addon is available in addon.addon.
        const addonToUse = addon.addon || addon;
        if (addonToUse.current_version) {
          const apiVersion = addonToUse.current_version;

          // Do not overwrite licence and release_notes data with nulls, which
          // are omitted from some API responses.
          // Discopane does not need this done, and does not get a version
          // property, so we can check for that too.
          if (
            apiVersion.version &&
            (!apiVersion.license || !apiVersion.release_notes)
          ) {
            const existingVersion = getVersionById({
              id: apiVersion.id,
              state,
            });
            if (existingVersion) {
              apiVersion.license =
                apiVersion.license || existingVersion.license;
              apiVersion.release_notes =
                apiVersion.release_notes || existingVersion.releaseNotes;
            }
          }

          const version = createInternalVersion(apiVersion);
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

    case LOAD_HOME_ADDONS: {
      const { collections, shelves } = action.payload;

      const newVersions = {};
      for (const shelf of Object.keys(shelves)) {
        if (shelves[shelf]) {
          for (const addon of shelves[shelf].results) {
            if (addon.current_version) {
              const version = createInternalVersion(addon.current_version);
              newVersions[version.id] = version;
            }
          }
        }
      }

      for (const collection of collections) {
        if (collection && collection.results) {
          for (const addon of collection.results) {
            const version = createInternalVersion(addon.addon.current_version);
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
      const { featured, highlyRated, trending } = action.payload;

      const newVersions = {};
      for (const apiResponse of [featured, highlyRated, trending]) {
        for (const addon of apiResponse.results) {
          if (addon.current_version) {
            const version = createInternalVersion(addon.current_version);
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
