import * as actions from 'core/actions/search';

describe('SEARCH_STARTED', () => {
  const action = actions.searchStart(
    { filters: { query: 'foo' }, page: 5, results: [] });

  it('sets the type', () => {
    expect(action.type).toEqual('SEARCH_STARTED');
  });

  it('sets the query and existing results', () => {
    expect(action.payload).toEqual({ filters: { query: 'foo' }, page: 5, results: [] });
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
