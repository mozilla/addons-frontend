import * as actions from 'core/actions/search';

describe('SEARCH_STARTED', () => {
  const payload = {
    errorHandlerId: 'Search',
    filters: { query: 'foo' },
    page: 5,
    results: [],
  };
  const action = actions.searchStart(payload);

  it('sets the type', () => {
    expect(action.type).toEqual('SEARCH_STARTED');
  });

  it('sets the query and existing results', () => {
    expect(action.payload).toEqual(payload);
  });

  it('throws an error if errorHandlerId is empty', () => {
    expect(() => {
      actions.searchStart({
        filters: {},
        page: 1,
        results: [],
      });
    }).toThrowError('errorHandlerId is required');
  });

  it('throws an error if filters are empty', () => {
    expect(() => {
      actions.searchStart({
        errorHandlerId: 'Search',
        page: 1,
        results: [],
      });
    }).toThrowError('filters are required');
  });

  it('throws an error if page is empty', () => {
    expect(() => {
      actions.searchStart({
        errorHandlerId: 'Search',
        filters: {},
        results: [],
      });
    }).toThrowError('page is required');
  });

  it('throws an error if results are empty', () => {
    expect(() => {
      actions.searchStart({
        errorHandlerId: 'Search',
        filters: {},
        page: 1,
      });
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
