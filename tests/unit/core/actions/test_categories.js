import * as actions from 'core/actions/categories';
import { CATEGORIES_FETCH, CATEGORIES_LOAD } from 'core/constants';

describe(__filename, () => {
  describe('CATEGORIES_FETCH', () => {
    function _categoriesFetch({ errorHandlerId = 'some-handler-id' } = {}) {
      return actions.categoriesFetch({ errorHandlerId });
    }

    it('sets the type', () => {
      expect(_categoriesFetch().type).toEqual(CATEGORIES_FETCH);
    });

    it('requires an error handler ID', () => {
      expect(() => actions.categoriesFetch()).toThrow(
        /errorHandlerId is required/,
      );
    });

    it('puts the error handler ID in the payload', () => {
      const errorHandlerId = 'some-custom-id';
      expect(
        _categoriesFetch({ errorHandlerId }).payload.errorHandlerId,
      ).toEqual(errorHandlerId);
    });
  });

  describe('CATEGORIES_LOAD', () => {
    const response = {
      entities: {},
      result: ['foo', 'bar'],
    };
    const action = actions.categoriesLoad(response);

    it('sets the type', () => {
      expect(action.type).toEqual(CATEGORIES_LOAD);
    });

    it('sets the payload', () => {
      expect(action.payload.result).toEqual(['foo', 'bar']);
    });
  });
});
