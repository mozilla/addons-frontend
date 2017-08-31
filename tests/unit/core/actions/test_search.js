import * as actions from 'core/actions/search';

describe('SEARCH_STARTED', () => {
  function _searchStart(props = {}) {
    return actions.searchStart({
      errorHandlerId: 'Search',
      filters: { page: 1, query: 'foø' },
      ...props,
    });
  }

  const action = _searchStart();

  it('sets the type', () => {
    expect(action.type).toEqual('SEARCH_STARTED');
  });

  it('sets the query and existing results', () => {
    expect(action.payload).toEqual({
      errorHandlerId: 'Search',
      filters: { page: 1, query: 'foø' },
    });
  });

  it('throws an error if errorHandlerId is empty', () => {
    expect(() => {
      _searchStart({ errorHandlerId: undefined });
    }).toThrowError('errorHandlerId is required');
  });

  it('throws an error if filters are empty', () => {
    expect(() => {
      _searchStart({ filters: undefined });
    }).toThrowError('filters are required');
  });
});

describe('SEARCH_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.searchLoad({ entities, result });

  it('sets the type', () => {
    expect(action.type).toEqual('SEARCH_LOADED');
  });

  it('sets the payload', () => {
    expect(action.payload).toEqual({ entities, result });
  });

  it('throws an error if entities are empty', () => {
    expect(() => {
      actions.searchLoad({ result });
    }).toThrowError('entities are required');
  });

  it('throws an error if result is empty', () => {
    expect(() => {
      actions.searchLoad({ entities });
    }).toThrowError('result is required');
  });
});
