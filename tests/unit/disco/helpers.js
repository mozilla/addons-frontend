import { normalize } from 'normalizr';

import { discoResult } from 'disco/api';

export function createFetchDiscoveryResult(results) {
  // Simulate how getDiscoveryAddons() applies its schema.
  return normalize({ results }, { results: [discoResult] });
}

export function createFakeEvent() {
  return {
    currentTarget: sinon.stub(),
    preventDefault: sinon.stub(),
  };
}
