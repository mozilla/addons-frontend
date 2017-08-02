import * as actions from 'core/actions/search';

describe('SEARCH_STARTED', () => {
  function _searchStart(props = {}) {
    return actions.searchStart({
      errorHandlerId: 'Search',
      filters: { query: 'foo' },
      page: 1,
      results: [],
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
      filters: { query: 'foo' },
      page: 1,
      results: [],
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

  it('throws an error if page is empty', () => {
    expect(() => {
      _searchStart({ page: undefined });
    }).toThrowError('page is required');
  });

  it('throws an error if results are empty', () => {
    expect(() => {
      _searchStart({ results: undefined });
    }).toThrowError('results are required');
  });
});

describe('SEARCH_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.searchLoad({ filters: { query: 'foø' }, entities, result });

  it('sets the type', () => {
    expect(action.type).toEqual('SEARCH_LOADED');
  });

  it('sets the payload', () => {
    expect(action.payload).toEqual({ filters: { query: 'foø' }, entities, result });
  });
});

describe('SEARCH_FAILED', () => {
  const action = actions.searchFail({ filters: { query: 'foo' }, page: 25 });

  it('sets the type', () => {
    expect(action.type).toEqual('SEARCH_FAILED');
  });

  it('sets the payload', () => {
    expect(action.payload).toEqual({ page: 25, filters: { query: 'foo' } });
  });
});
