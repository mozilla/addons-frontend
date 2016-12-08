import * as actions from 'amo/actions/highlyRated';


describe('HIGHLY_RATED_GET', () => {
  const action = actions.highlyRatedStart(
    { filters: { page_size: 5, sort: 'foo' } });

  it('sets the type', () => {
    assert.equal(action.type, 'HIGHLY_RATED_GET');
  });

  it('sets the filters', () => {
    assert.deepEqual(action.payload,
      { filters: { page_size: 5, sort: 'foo' }, page: undefined });
  });
});

describe('HIGHLY_RATED_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.highlyRatedLoad(
    { filters: { sort: 'foø' }, entities, result });

  it('sets the type', () => {
    assert.equal(action.type, 'HIGHLY_RATED_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload,
      { filters: { sort: 'foø' }, entities, result });
  });
});

describe('HIGHLY_RATED_FAILED', () => {
  const action = actions.highlyRatedFail(
    { filters: { sort: 'foo' }, page: 25 });

  it('sets the type', () => {
    assert.equal(action.type, 'HIGHLY_RATED_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { page: 25, filters: { sort: 'foo' } });
  });
});
