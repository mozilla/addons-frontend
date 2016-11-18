import {
  VERSION_GET,
  VERSION_LOADED,
  VERSION_FAILED,
} from 'core/constants';


export function versionGet({ slug, versionID }) {
  return {
    type: VERSION_GET,
    payload: { slug, versionID },
  };
}

export function versionLoad({ entities }) {
  return {
    type: VERSION_LOADED,
    payload: {
      result: entities ? entities.versions : null,
    },
  };
}

export function versionFail({ slug, versionID }) {
  return {
    type: VERSION_FAILED,
    payload: { slug, versionID },
  };
}
