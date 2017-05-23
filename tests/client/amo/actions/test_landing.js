import { getLanding, loadLanding, failLanding } from 'amo/actions/landing';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('LANDING_GET', () => {
  const action = getLanding({ addonType: ADDON_TYPE_THEME });

  it('sets the type', () => {
    expect(action.type).toEqual('LANDING_GET');
  });

  it('sets the filters', () => {
    expect(action.payload).toEqual({ addonType: ADDON_TYPE_THEME });
  });

  it('throws if no addonType is set', () => {
    expect(() => getLanding({})).toThrow();
  });
});

describe('LANDING_LOADED', () => {
  const response = {
    featured: sinon.stub(),
    highlyRated: sinon.stub(),
    popular: sinon.stub(),
  };
  const action = loadLanding({ addonType: ADDON_TYPE_THEME, ...response });

  it('sets the type', () => {
    expect(action.type).toEqual('LANDING_LOADED');
  });

  it('sets the payload', () => {
    expect(action.payload).toEqual({ addonType: ADDON_TYPE_THEME, ...response });
  });
});

describe('LANDING_FAILED', () => {
  const action = failLanding({ addonType: 'extension' });

  it('sets the type', () => {
    expect(action.type).toEqual('LANDING_FAILED');
  });

  it('sets the payload', () => {
    expect(action.payload).toEqual({ addonType: 'extension' });
  });
});
