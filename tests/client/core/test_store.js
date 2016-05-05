import { middleware } from 'core/store';

describe('core store middleware', () => {
  it('includes the middleware in development', () => {
    const config = {
      get() {
        return true;
      },
    };
    assert.isFunction(middleware({__config: config}));
  });

  it('is undefined when not in development', () => {
    const config = {
      get() {
        return false;
      },
    };
    assert.strictEqual(undefined, middleware({__config: config}));
  });
});
