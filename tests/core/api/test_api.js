import * as api from 'core/api';

describe('search api', () => {
  let mockWindow;

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  afterEach(() => {
    mockWindow.restore();
  });

  function mockResponse() {
    return Promise.resolve({
      json() {
        return Promise.resolve({
          results: [
            {slug: 'foo'},
            {slug: 'food'},
            {slug: 'football'},
          ],
        });
      },
    });
  }

  it('sets the lang, limit, page and query', () => {
    // FIXME: This shouldn't fail if the args are in a different order.
    mockWindow.expects('fetch')
      .withArgs('https://addons.mozilla.org/api/v3/addons/search/?q=foo&lang=en-US&page=3')
      .once()
      .returns(mockResponse());
    return api.search({query: 'foo', page: 3}).then(() => mockWindow.verify());
  });

  it('normalizes the response', () => {
    mockWindow.expects('fetch').once().returns(mockResponse());
    return api.search({query: 'foo'}).then((results) => {
      assert.deepEqual(results.result.results, ['foo', 'food', 'football']);
      assert.deepEqual(results.entities, {
        addons: {
          foo: {slug: 'foo'},
          food: {slug: 'food'},
          football: {slug: 'football'},
        },
      });
    });
  });
});

describe('add-on api', () => {
  let mockWindow;

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  afterEach(() => {
    mockWindow.restore();
  });

  function mockResponse() {
    return Promise.resolve({
      json() {
        return Promise.resolve({
          name: 'Foo!',
          slug: 'foo',
        });
      },
    });
  }

  it('sets the lang and slug', () => {
    mockWindow.expects('fetch')
      .withArgs('https://addons.mozilla.org/api/v3/addons/addon/foo/?lang=en-US')
      .once()
      .returns(mockResponse());
    return api.fetchAddon('foo').then(() => mockWindow.verify());
  });

  it('normalizes the response', () => {
    mockWindow.expects('fetch').once().returns(mockResponse());
    return api.fetchAddon('foo').then((results) => {
      const foo = {slug: 'foo', name: 'Foo!'};
      assert.deepEqual(results.result, 'foo');
      assert.deepEqual(results.entities, {addons: {foo}});
    });
  });
});
