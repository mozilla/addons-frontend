import {
  VERSION_GET,
  VERSION_LOADED,
  VERSION_FAILED,
} from 'core/constants';
import * as actions from 'core/actions/version';

describe(VERSION_GET, () => {
  const action = actions.versionGet({ slug: 'foo', versionID: 20 });

  it('sets the type', () => {
    assert.equal(action.type, VERSION_GET);
  });

  it('sets the query', () => {
    assert.deepEqual(action.payload, { slug: 'foo', versionID: 20 });
  });
});

describe(VERSION_LOADED, () => {
  const entities = { versions: 'foo' };
  const action = actions.versionLoad({ entities });

  it('sets the type', () => {
    assert.equal(action.type, VERSION_LOADED);
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { result: 'foo' });
  });
});

describe(VERSION_FAILED, () => {
  const action = actions.versionFail({ slug: 'foo', versionID: 20 });

  it('sets the type', () => {
    assert.equal(action.type, VERSION_FAILED);
  });

  // it('sets the payload', () => {
  //   assert.deepEqual(action.payload, { loading: false });
  // });
});
