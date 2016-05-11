import { ClientConfig } from 'client-config';

describe('client-config module', () => {
  let config;

  beforeEach(() => {
    config = new ClientConfig({
      foo: 'test-value-1',
      bar: 'test-value-2',
    });
  });

  it('provides no access to the underlying data from outside', () => {
    assert.equal(config.objData, undefined);
  });

  it('has the right methods', () => {
    assert.sameMembers(Object.keys(new ClientConfig({})), ['get', 'has']);
  });

  describe('ClientConfig.get()', () => {
    it('returns a key when present', () => {
      assert.equal(config.get('foo'), 'test-value-1');
    });

    it('throws if key is missing', () => {
      assert.throws(() => {
        config.get('missing-key');
      }, Error, /Key was not found in clientConfig/);
    });
  });

  describe('ClientConfig.has()', () => {
    it('returns true if key is present', () => {
      assert.ok(config.has('foo'));
    });

    it('returns false if key is missing', () => {
      assert.notOk(config.has('whatevs'));
    });
  });
});
