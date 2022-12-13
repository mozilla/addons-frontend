import { ClientConfig } from 'amo/client/config';

describe(__filename, () => {
  let config;

  beforeEach(() => {
    config = new ClientConfig({
      foo: 'test-value-1',
      bar: 'test-value-2',
    });
  });

  it('provides no access to the underlying data from outside', () => {
    expect(config.objData).toEqual(undefined);
  });

  it('has the right methods', () => {
    expect(Object.keys(new ClientConfig({}))).toEqual(
      expect.arrayContaining(['get', 'has']),
    );
  });

  describe('ClientConfig.get()', () => {
    it('returns a key when present', () => {
      expect(config.get('foo')).toEqual('test-value-1');
    });

    it('throws if key is missing', () => {
      expect(() => {
        config.get('missing-key');
      }).toThrow(/Key "missing-key" was not found in clientConfig/);
    });
  });

  describe('ClientConfig.has()', () => {
    it('returns true if key is present', () => {
      expect(config.has('foo')).toBeTruthy();
    });

    it('returns false if key is missing', () => {
      expect(config.has('whatevs')).toBeFalsy();
    });
  });
});
