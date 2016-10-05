import * as actions from 'core/actions/search';

describe('SEARCH_STARTED', () => {
  const params = {
    page: 7,
    addonType: 'theme',
    app: 'android',
    category: undefined,
    query: 'foo',
  };
  const action = actions.searchStart(params);

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_STARTED');
  });

  it('sets the query', () => {
    assert.deepEqual(action.payload, params);
  });
});

describe('SEARCH_LOADED', () => {
  const params = {
    entities: sinon.stub(),
    result: sinon.stub(),
    addonType: 'extension',
    app: 'firefox',
    category: 'alerts-notifications',
    query: 'foo',
  };
  const action = actions.searchLoad(params);

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, params);
  });
});

describe('SEARCH_FAILED', () => {
  const params = {
    page: 25,
    addonType: 'extension',
    app: 'firefox',
    category: 'alerts-notifications',
    query: 'foo',
  };
  const action = actions.searchFail(params);

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, params);
  });
});
