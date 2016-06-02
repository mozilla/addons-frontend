import * as actions from 'core/actions';

describe('core actions setJWT', () => {
  it('creates a SET_JWT action', () => {
    assert.deepEqual(
      actions.setJWT('my.amo.token'),
      {type: 'SET_JWT', payload: {token: 'my.amo.token'}});
  });
});

describe('core actions setLang', () => {
  it('creates the SET_LANG action', () => {
    assert.deepEqual(
      actions.setLang('fr'),
      {type: 'SET_LANG', payload: {lang: 'fr'}});
  });
});

describe('ENTITIES_LOADED', () => {
  const entities = sinon.stub();
  const action = actions.loadEntities(entities);

  it('sets the type', () => {
    assert.equal(action.type, 'ENTITIES_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, {entities});
  });
});
