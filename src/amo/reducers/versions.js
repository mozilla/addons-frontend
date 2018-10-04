/* @flow */
import invariant from 'invariant';

import type {
  AddonCompatibilityType,
  AddonFileType,
  ExternalAddonVersionType,
} from 'core/types/addons';

export const FETCH_VERSIONS: 'FETCH_VERSIONS' = 'FETCH_VERSIONS';
export const LOAD_VERSIONS: 'LOAD_VERSIONS' = 'LOAD_VERSIONS';

export type AddonVersionType = {
  compatibility?: AddonCompatibilityType,
  created: string,
  files: Array<AddonFileType>,
  filesize: number,
  id: number,
  license: { name: string, url: string },
  releaseNotes?: string,
  version: string,
};

export const createInternalVersion = (
  version: ExternalAddonVersionType,
): AddonVersionType => {
  // TODO: We should find the correct file, for now we'll just take the first one.
  // Note that multiple files per version is going away, but not quite yet.
  const file = version.files[0];
  return {
    compatibility: version.compatibility,
    created: file.created,
    files: version.files,
    filesize: file.size,
    id: version.id,
    license: { name: version.license.name, url: version.license.url },
    releaseNotes: version.release_notes,
    version: version.version,
  };
};

export type VersionsState = {
  bySlug: {
    [slug: string]: { versions: Array<AddonVersionType>, loading: boolean },
  },
};

export const initialState: VersionsState = {
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
  return (infoForSlug && infoForSlug.versions) || null;
};

export const getLoadingBySlug = ({ slug, state }: GetBySlugParams): boolean => {
  invariant(slug, 'slug is required');
  invariant(state, 'state is required');

  const infoForSlug = state.bySlug[slug];
  return Boolean(infoForSlug && infoForSlug.loading);
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
            versions: null,
            loading: true,
          },
        },
      };
    }

    case LOAD_VERSIONS: {
      const { slug, versions } = action.payload;

      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [slug]: {
            versions: versions.map(createInternalVersion),
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
