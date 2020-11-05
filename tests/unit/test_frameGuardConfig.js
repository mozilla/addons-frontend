describe(__filename, () => {
  it('should default frameGuard to "deny" in production', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const conf = require('config');
    const frameGuardConfig = conf.get('frameGuard');
    expect(frameGuardConfig.action).toEqual('deny');
    expect(frameGuardConfig.domain).toEqual(undefined);
  });
});
