import { getFeatured, loadFeatured } from 'amo/actions/featured';


describe('FEATURED_GET', () => {
  const action = getFeatured({ addonType: 'theme' });

  it('sets the type', () => {
    assert.equal(action.type, 'FEATURED_GET');
  });

  it('sets the filters', () => {
    assert.deepEqual(action.payload, { addonType: 'theme' });
  });

  it('throws if no addonType is set', () => {
    assert.throws(() => getFeatured({}), 'addonType must be set');
  });
});

describe('FEATURED_LOADED', () => {
  const response = {
    entities: sinon.stub(),
    result: sinon.stub(),
  };
  const action = loadFeatured({ addonType: 'theme', ...response });

  it('sets the type', () => {
    assert.equal(action.type, 'FEATURED_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { addonType: 'theme', ...response });
  });
});
