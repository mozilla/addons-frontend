import homeReducer, {
  fetchHomeAddons,
  initialState,
  loadHomeAddons,
} from 'amo/reducers/home';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createAddonsApiResult,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = homeReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      const state = homeReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    it('loads the add-ons to display on homepage', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(loadHomeAddons({
        popularExtensions: createAddonsApiResult([fakeAddon]),
      }));

      const homeState = store.getState().home;

      expect(homeState.popularExtensions).toEqual([
        createInternalAddon(fakeAddon),
      ]);
    });
  });

  describe('fetchHomeAddons()', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
    };

    it('throws an error when errorHandlerId is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.errorHandlerId;

      expect(() => {
        fetchHomeAddons(partialParams);
      }).toThrow('errorHandlerId is required');
    });
  });

  describe('loadHomeAddons()', () => {
    const defaultParams = {
      popularExtensions: {},
    };

    it('throws an error when popular extensions are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.popularExtensions;

      expect(() => {
        loadHomeAddons(partialParams);
      }).toThrow('popularExtensions is required');
    });
  });
});
