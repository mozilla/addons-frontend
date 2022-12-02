import rootSagas from 'amo/sagas';

describe(__filename, () => {
  it('should run all sagas without an error', () => {
    expect(() => {
      rootSagas().next();
    }).not.toThrow();
  });
});
