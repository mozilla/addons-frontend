import { getLanding, loadLanding, failLanding } from 'amo/actions/landing';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('LANDING_GET', () => {
  const getActionParams = () => ({
    addonType: ADDON_TYPE_THEME,
    errorHandlerId: 'some-error-handler',
  });
  const action = getLanding(getActionParams());

  it('sets the type', () => {
    expect(action.type).toEqual('LANDING_GET');
  });

  it('sets the filters', () => {
    expect(action.payload).toEqual({
      addonType: ADDON_TYPE_THEME,
      errorHandlerId: 'some-error-handler',
    });
  });

  it('throws if no addonType is set', () => {
    const params = getActionParams();
    delete params.addonType;
    expect(() => getLanding(params)).toThrowError('addonType must be set');
  });

  it('throws if no errorHandlerId is set', () => {
    const params = getActionParams();
    delete params.errorHandlerId;
    expect(() => getLanding(params))
      .toThrowError('errorHandlerId must be set');
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
