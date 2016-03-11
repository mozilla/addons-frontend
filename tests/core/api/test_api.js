import { search } from 'core/api';

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

  it('sets the lang and query', () => {
    // FIXME: This shouldn't fail if the args are in a different order.
    mockWindow.expects('fetch')
      .withArgs('https://addons.mozilla.org/api/v3/addons/search/?q=foo&lang=en-US')
      .once()
      .returns(mockResponse());
    return search({query: 'foo'}).then(() => mockWindow.verify());
  });

  it('normalizes the response', () => {
    mockWindow.expects('fetch').once().returns(mockResponse());
    return search({query: 'foo'}).then((results) => {
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
