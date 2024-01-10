/* @flow */
import defaultLocalForage from 'localforage';

import log from 'amo/logger';
import { normalizeFileNameId } from 'amo/utils';

export function configureLocalForage({
  localForage = defaultLocalForage,
}: { localForage: typeof defaultLocalForage } = {}) {
  localForage.config({
    name: 'addons-frontend',
    version: '1.0',
    storeName: normalizeFileNameId(__filename),
  });
}

type LocalStateOptions = {
  localForage: typeof defaultLocalForage,
};

export class LocalState {
  id: string;

  localForage: typeof defaultLocalForage;

  constructor(
    id: string,
    { localForage = defaultLocalForage }: LocalStateOptions = {},
  ) {
    this.id = id;
    this.localForage = localForage;
    configureLocalForage({ localForage });
  }

  load(): Promise<Object | null> {
    return this.localForage
      .getItem(this.id)
      .then((data) => {
        if (!data) {
          return null;
        }
        return data;
      })
      .catch((error) => {
        log.debug(`Error with localForage.getItem("${this.id}"): ${error}`);
        throw error;
      });
  }

  clear(): Promise<void> {
    return this.localForage.removeItem(this.id).catch((error) => {
      log.debug(`Error with localForage.removeItem("${this.id}"): ${error}`);
      throw error;
    });
  }

  save(data: Object): Promise<void> {
    if (typeof data !== 'object' || data === null) {
      return Promise.reject(
        new Error('The argument to save() must be an object'),
      );
    }
    return this.localForage.setItem(this.id, data).catch((error) => {
      log.debug(`Error with localForage.setItem("${this.id}"): ${error}`);
      throw error;
    });
  }
}

export default function createLocalState(
  id: string,
  options?: LocalStateOptions,
): LocalState {
  return new LocalState(id, options);
}
