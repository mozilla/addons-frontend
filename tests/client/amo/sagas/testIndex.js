import rootSagas from 'amo/sagas';


describe('amo rootSagas', () => {
  it('should run all sagas without an error', () => {
    assert.doesNotThrow(() => {
      rootSagas().next();
    });
  });
});
