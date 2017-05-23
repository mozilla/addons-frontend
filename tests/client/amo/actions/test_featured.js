import { getFeatured, loadFeatured } from 'amo/actions/featured';


describe('FEATURED_GET', () => {
  const action = getFeatured({ addonType: 'theme' });

  it('sets the type', () => {
    expect(action.type).toEqual('FEATURED_GET');
  });

  it('sets the filters', () => {
    expect(action.payload).toEqual({ addonType: 'theme' });
  });

  it('throws if no addonType is set', () => {
    expect(() => getFeatured({})).toThrow();
  });
});

describe('FEATURED_LOADED', () => {
  const response = {
    entities: sinon.stub(),
    result: sinon.stub(),
  };
  const action = loadFeatured({ addonType: 'theme', ...response });

  it('sets the type', () => {
    expect(action.type).toEqual('FEATURED_LOADED');
  });

  it('sets the payload', () => {
    expect(action.payload).toEqual({ addonType: 'theme', ...response });
  });
});
