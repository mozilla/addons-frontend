import * as actions from 'core/actions';
import { userAgents } from 'tests/unit/helpers';


describe('core actions setAuthToken', () => {
  it('requires a token', () => {
    expect(() => actions.setAuthToken())
      .toThrowError(/token cannot be falsey/);
  });
});

describe('core actions setLang', () => {
  it('creates the SET_LANG action', () => {
    expect(actions.setLang('fr')).toEqual({ type: 'SET_LANG', payload: { lang: 'fr' } });
  });
});

describe('core actions setClientApp', () => {
  it('creates the SET_CLIENT_APP action', () => {
    expect(actions.setClientApp('firefox')).toEqual({ type: 'SET_CLIENT_APP', payload: { clientApp: 'firefox' } });
  });

  it('requires a clientApp value', () => {
    expect(() => actions.setClientApp(''))
      .toThrowError(/cannot be falsey/);
  });
});

describe('core actions setUserAgent', () => {
  it('creates the SET_USER_AGENT action', () => {
    const userAgent = userAgents.chrome[0];

    expect(actions.setUserAgent(userAgent)).toEqual({
      type: 'SET_USER_AGENT',
      payload: { userAgent },
    });
  });
});

describe('ENTITIES_LOADED', () => {
  const entities = sinon.stub();
  const action = actions.loadEntities(entities);

  it('sets the type', () => {
    expect(action.type).toEqual('ENTITIES_LOADED');
  });

  it('sets the payload', () => {
    expect(action.payload).toEqual({ entities });
  });
});
