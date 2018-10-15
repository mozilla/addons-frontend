/* @flow */
import invariant from 'invariant';

import { createPlatformFiles } from 'core/reducers/addons';
import { findFileForPlatform } from 'core/utils';
import type { UserAgentInfoType } from 'core/reducers/api';
import type {
  AddonCompatibilityType,
  ExternalAddonVersionType,
  PlatformFilesType,
} from 'core/types/addons';

export const FETCH_VERSIONS: 'FETCH_VERSIONS' = 'FETCH_VERSIONS';
export const LOAD_VERSIONS: 'LOAD_VERSIONS' = 'LOAD_VERSIONS';

type VersionIdType = number;

export type AddonVersionType = {
  compatibility?: AddonCompatibilityType,
  platformFiles: PlatformFilesType,
  id: VersionIdType,
  license: { name: string, url: string },
  releaseNotes?: string,
  version: string,
};

export const createInternalVersion = (
  version: ExternalAddonVersionType,
): AddonVersionType => {
  return {
    compatibility: version.compatibility,
    platformFiles: createPlatformFiles(version),
    id: version.id,
    license: { name: version.license.name, url: version.license.url },
    releaseNotes: version.release_notes,
    version: version.version,
  };
};

export type VersionsState = {
  byId: {
    [id: number]: AddonVersionType,
  },
  bySlug: {
    [slug: string]: { versionIds: Array<VersionIdType>, loading: boolean },
  },
};

export const initialState: VersionsState = {
  byId: {},
  bySlug: {},
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
  const versionIds = infoForSlug && infoForSlug.versionIds;
  if (versionIds) {
    return versionIds.map((versionId) => {
      return state.byId[versionId];
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
  const version = state.byId[versionId];

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

    default:
      return state;
  }
};

export default reducer;
