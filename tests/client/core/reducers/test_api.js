import * as actions from 'core/actions';
import api from 'core/reducers/api';

describe('api reducer', () => {
  it('maintains the old state', () => {
    const state = { some: 'state' };
    assert.strictEqual(api(state, { type: 'UNRELATED' }), state);
  });

  it('stores the JWT', () => {
    const token = 'some.base64.STRING';
    assert.deepEqual(api({ foo: 'bar' },
      { type: 'SET_JWT', payload: { token } }), { foo: 'bar', token });
  });

  it('clears the JWT on log out', () => {
    assert.deepEqual(
      api({ lang: 'fr', clientApp: 'firefox', token: 'secret' },
          actions.logOutUser()),
      { lang: 'fr', clientApp: 'firefox' });
  });

  it('stores the lang', () => {
    const lang = 'de';
    assert.deepEqual(api({ bar: 'baz' },
      { type: 'SET_LANG', payload: { lang } }), { bar: 'baz', lang });
  });

  it('stores the clientApp', () => {
    const existingState = { bar: 'baz' };
    const clientApp = 'firefox';
    assert.deepEqual(
      api(existingState, actions.setClientApp(clientApp)),
      { ...existingState, clientApp });
  });

  it('defaults to an empty object', () => {
    assert.deepEqual(api(undefined, { type: 'UNRELATED' }), {});
  });
});
