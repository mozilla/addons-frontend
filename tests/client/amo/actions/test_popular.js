import * as actions from 'amo/actions/popular';


describe('POPULAR_GET', () => {
  const action = actions.popularStart(
    { filters: { page_size: 5, sort: 'foo' } });

  it('sets the type', () => {
    assert.equal(action.type, 'POPULAR_GET');
  });

  it('sets the filters', () => {
    assert.deepEqual(action.payload,
      { filters: { page_size: 5, sort: 'foo' }, page: undefined });
  });
});

describe('POPULAR_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.popularLoad(
    { filters: { sort: 'foø' }, entities, result });

  it('sets the type', () => {
    assert.equal(action.type, 'POPULAR_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload,
      { filters: { sort: 'foø' }, entities, result });
  });
});

describe('POPULAR_FAILED', () => {
  const action = actions.popularFail(
    { filters: { sort: 'foo' }, page: 25 });

  it('sets the type', () => {
    assert.equal(action.type, 'POPULAR_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { page: 25, filters: { sort: 'foo' } });
  });
});
