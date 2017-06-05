// eslint-disable-next-line import/named
import { bindConsoleMethod } from 'core/logger';

describe('logger.bindConsoleMethod()', () => {
  let fakeConsole;
  let fakeConfig;

  beforeEach(() => {
    fakeConsole = {
      log: sinon.stub(),
      info: sinon.stub(),
    };
    fakeConfig = {
      get: sinon.stub(),
    };
    fakeConfig.get.withArgs('appName').returns('disco');
    fakeConfig.get.withArgs('enableClientConsole').returns(true);
  });

  function getAlias(method = 'info', opts = {}) {
    return bindConsoleMethod(method, { _consoleObj: fakeConsole, _config: fakeConfig, ...opts });
  }

  it('aliases as expected', () => {
    const logAlias = getAlias('log');
    logAlias('whatever');
    expect(fakeConsole.log.called).toBeTruthy();
  });

  it('throws if the method does not exist on the object', () => {
    expect(() => {
      getAlias('bazinga');
    }).toThrowError('console method "bazinga" does not exist');
  });

  it('should call Function.prototype.apply if bind does not exist', () => {
    const fakeFunc = {
      prototype: {
        bind: null,
        apply: sinon.stub(),
      },
    };
    const infoAlias = getAlias('info', { _function: fakeFunc });
    infoAlias('hello');
    expect(fakeFunc.prototype.apply.called).toBeTruthy();
  });

  it('uses a noop function if the client console loggin is off', () => {
    fakeConfig.get.withArgs('enableClientConsole').returns(false);
    const fakeNoopFunc = sinon.stub();
    const infoAlias = getAlias('info', { _noop: fakeNoopFunc });
    infoAlias('hello');
    expect(fakeNoopFunc.called).toBeTruthy();
  });

  it('still throws if invalid method despite being noop', () => {
    fakeConfig.get.withArgs('enableClientConsole').returns(false);
    const fakeNoopFunc = sinon.stub();
    expect(() => {
      getAlias('bazinga', { _noop: fakeNoopFunc });
    }).toThrowError('console method "bazinga" does not exist');
  });
});
