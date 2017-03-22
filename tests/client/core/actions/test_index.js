import * as actions from 'core/actions';
import { userAgents } from 'tests/client/helpers';


describe('core actions setAuthToken', () => {
  it('requires a token', () => {
    assert.throws(
      () => actions.setAuthToken(), /token cannot be falsey/);
  });
});

describe('core actions setLang', () => {
  it('creates the SET_LANG action', () => {
    assert.deepEqual(
      actions.setLang('fr'),
      { type: 'SET_LANG', payload: { lang: 'fr' } });
  });
});

describe('core actions setClientApp', () => {
  it('creates the SET_CLIENT_APP action', () => {
    assert.deepEqual(
      actions.setClientApp('firefox'),
      { type: 'SET_CLIENT_APP', payload: { clientApp: 'firefox' } });
  });

  it('requires a clientApp value', () => {
    assert.throws(() => actions.setClientApp(''), /cannot be falsey/);
  });
});

describe('core actions setUserAgent', () => {
  it('creates the SET_USER_AGENT action', () => {
    const userAgent = userAgents.chrome[0];

    assert.deepEqual(actions.setUserAgent(userAgent), {
      type: 'SET_USER_AGENT',
      payload: { userAgent },
    });
  });
});

describe('ENTITIES_LOADED', () => {
  const entities = sinon.stub();
  const action = actions.loadEntities(entities);

  it('sets the type', () => {
    assert.equal(action.type, 'ENTITIES_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { entities });
  });
});
