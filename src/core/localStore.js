/* @flow */
import localForage from 'localforage';

import log from 'core/logger';

export default class LocalStore {
  id: string;

  constructor(id: string) {
    this.id = id;
    localForage.config({
      name: 'addons-frontend',
      version: '1.0',
      storeName: 'core.localStore',
    });
  }

  getData(): Promise<Object> {
    return localForage.getItem(this.id)
      .then((data) => {
        if (!data) {
          return {};
        }
        return data;
      })
      .catch((error) => {
        log.error(`error with localForage.getItem("${this.id}"): ${error}`);
        throw error;
      });
  }

  removeData(): Promise<void> {
    return localForage.removeItem(this.id)
      .catch((error) => {
        log.error(`error with localForage.removeItem("${this.id}"): ${error}`);
        throw error;
      });
  }

  setData(data: Object): Promise<void> {
    return localForage.setItem(this.id, data)
      .catch((error) => {
        log.error(`error with localForage.setItem("${this.id}"): ${error}`);
        throw error;
      });
  }
}
