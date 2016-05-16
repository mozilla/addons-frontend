import { bindConsoleMethod } from 'core/logger';

describe('logger.bindConsoleMethod()', () => {
  const fakeConsole = {
    log: sinon.stub(),
    info: sinon.stub(),
  };

  it('aliases as expected', () => {
    const logAlias = bindConsoleMethod('log', fakeConsole);
    logAlias('whatever');
    assert.ok(fakeConsole.log.called, 'log should be called');
  });

  it('throws if the method does not exist on the object', () => {
    assert.throws(() => {
      bindConsoleMethod('bazinga', fakeConsole);
    }, Error, 'console method "bazinga" does not exist');
  });

  it('should call Function.prototype.apply if bind does not exist', () => {
    const fakeFunc = {
      prototype: {
        bind: null,
        apply: sinon.stub(),
      },
    };
    const infoAlias = bindConsoleMethod('info', fakeConsole, fakeFunc);
    infoAlias('hello');
    assert.ok(fakeFunc.prototype.apply.called);
  });
});
