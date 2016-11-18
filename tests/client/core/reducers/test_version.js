import {
  VERSION_GET,
  VERSION_LOADED,
  VERSION_FAILED,
} from 'core/constants';
import version from 'core/reducers/version';


describe('version reducer', () => {
  it('defaults to not loading', () => {
    const { loading } = version(undefined, { type: 'unrelated' });
    assert.strictEqual(loading, false);
  });

  describe(VERSION_GET, () => {
    it('sets loading', () => {
      const state = version(
        { loading: false, slug: 'my-addon' },
        { type: VERSION_GET, payload: { slug: 'your-addon' } });

      assert.equal(state.slug, 'your-addon');
      assert.strictEqual(state.loading, true);
    });
  });

  describe(VERSION_LOADED, () => {
    it('sets the payload and loading', () => {
      const state = version(
        { loading: true },
        { type: VERSION_LOADED,
          payload: {
            result: {
              42626: { license: { url: 'foo.com' } },
            },
          },
        },
      );

      assert.equal(state[42626].license.url, 'foo.com');
      assert.strictEqual(state.loading, false);
    });
  });

  describe(VERSION_FAILED, () => {
    it('sets the error and loading', () => {
      const state = version(
        { loading: true },
        { type: VERSION_FAILED },
      );

      assert.strictEqual(state.loading, false);
      assert.strictEqual(state.error, true);
    });
  });
});
