describe(__filename, () => {
  it(`checks clientAppRoutes items are present in validClientAppUrlExceptions`, () => {
    /*
     * Without this the clientAppRoutes will not work as expected. If you want
     * /en-US/blah to hit the app, 'blah' must be in both clientAppRoutes
     * and validClientAppUrlExceptions in the app config.
     */
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const conf = require('config');
    const clientAppExceptions = conf.get('validClientAppUrlExceptions');
    const clientAppRoutes = conf.get('clientAppRoutes');
    expect(clientAppExceptions).toEqual(
      expect.arrayContaining(clientAppRoutes),
    );
  });
});
