import { getLanding, loadLanding, failLanding } from 'amo/actions/landing';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('LANDING_GET', () => {
  const action = getLanding({ addonType: ADDON_TYPE_THEME });

  it('sets the type', () => {
    assert.equal(action.type, 'LANDING_GET');
  });

  it('sets the filters', () => {
    assert.deepEqual(action.payload, { addonType: ADDON_TYPE_THEME });
  });

  it('throws if no addonType is set', () => {
    assert.throws(() => getLanding({}), 'addonType must be set');
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
    assert.equal(action.type, 'LANDING_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { addonType: ADDON_TYPE_THEME, ...response });
  });
});

describe('LANDING_FAILED', () => {
  const action = failLanding({ addonType: 'extension' });

  it('sets the type', () => {
    assert.equal(action.type, 'LANDING_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { addonType: 'extension' });
  });
});
