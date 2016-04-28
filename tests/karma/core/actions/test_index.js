import * as actions from 'core/actions';

describe('core actions setJWT', () => {
  it('creates a SET_JWT action', () => {
    assert.deepEqual(
      actions.setJWT('my.amo.token'),
      {type: 'SET_JWT', payload: {token: 'my.amo.token'}});
  });
});
