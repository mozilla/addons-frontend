import * as actions from 'amo/actions/featured';


describe('FEATURED_GET', () => {
  const action = actions.featuredGet({ addonType: 'theme' });

  it('sets the type', () => {
    assert.equal(action.type, 'FEATURED_GET');
  });

  it('sets the filters', () => {
    assert.deepEqual(action.payload, { addonType: 'theme' });
  });
});

describe('FEATURED_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.featuredLoad({ addonType: 'theme', entities, result });

  it('sets the type', () => {
    assert.equal(action.type, 'FEATURED_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { addonType: 'theme', entities, result });
  });
});

describe('FEATURED_FAILED', () => {
  const action = actions.featuredFail({ addonType: 'extension' });

  it('sets the type', () => {
    assert.equal(action.type, 'FEATURED_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { addonType: 'extension' });
  });
});
