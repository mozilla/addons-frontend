/* global window */

import * as api from 'core/api';
import { unexpectedSuccess } from 'tests/client/helpers';

describe('api', () => {
  let mockWindow;

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  describe('search api', () => {
    function mockResponse() {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({
            results: [
              { slug: 'foo' },
              { slug: 'food' },
              { slug: 'football' },
            ],
          });
        },
      });
    }

    it('sets the lang, limit, page and query', () => {
      // FIXME: This shouldn't fail if the args are in a different order.
      mockWindow.expects('fetch')
        .withArgs(
          'https://addons.mozilla.org/api/v3/internal/addons/search/?q=foo&page=3&lang=en-US')
        .once()
        .returns(mockResponse());
      return api.search({ api: { lang: 'en-US' }, query: 'foo', page: 3 })
        .then(() => mockWindow.verify());
    });

    it('normalizes the response', () => {
      mockWindow.expects('fetch').once().returns(mockResponse());
      return api.search({ query: 'foo' })
        .then((results) => {
          assert.deepEqual(results.result.results, ['foo', 'food', 'football']);
          assert.deepEqual(results.entities, {
            addons: {
              foo: { slug: 'foo' },
              food: { slug: 'food' },
              football: { slug: 'football' },
            },
          });
        });
    });
  });

  describe('add-on api', () => {
    function mockResponse() {
      return Promise.resolve({
        ok: true,
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
        .withArgs(
          'https://addons.mozilla.org/api/v3/addons/addon/foo/?lang=en-US',
          { headers: {}, method: 'get' })
        .once()
        .returns(mockResponse());
      return api.fetchAddon({ api: { lang: 'en-US' }, slug: 'foo' })
        .then(() => mockWindow.verify());
    });

    it('normalizes the response', () => {
      mockWindow.expects('fetch').once().returns(mockResponse());
      return api.fetchAddon('foo')
        .then((results) => {
          const foo = { slug: 'foo', name: 'Foo!' };
          assert.deepEqual(results.result, 'foo');
          assert.deepEqual(results.entities, { addons: { foo } });
        });
    });

    it('fails when the add-on is not found', () => {
      mockWindow
        .expects('fetch')
        .withArgs(
          'https://addons.mozilla.org/api/v3/addons/addon/foo/?lang=en-US',
          { headers: {}, method: 'get' })
        .once()
        .returns(Promise.resolve({ ok: false }));
      return api.fetchAddon({ api: { lang: 'en-US' }, slug: 'foo' })
        .then(unexpectedSuccess,
          (error) => assert.equal(error.message, 'Error calling API'));
    });

    it('includes the authorization token if available', () => {
      const token = 'bAse64.enCodeD.JWT';
      mockWindow
        .expects('fetch')
        .withArgs(
          'https://addons.mozilla.org/api/v3/addons/addon/bar/?lang=en-US',
          { headers: { authorization: `Bearer ${token}` }, method: 'get' })
        .once()
        .returns(mockResponse());
      return api.fetchAddon({ api: { lang: 'en-US', token }, slug: 'bar' })
        .then((results) => {
          const foo = { slug: 'foo', name: 'Foo!' };
          assert.deepEqual(results.result, 'foo');
          assert.deepEqual(results.entities, { addons: { foo } });
          mockWindow.verify();
        });
    });
  });

  describe('login', () => {
    const response = { token: 'use.this.jwt' };
    function mockResponse() {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve(response);
        },
      });
    }

    it('sends the code and state', () => {
      mockWindow
        .expects('fetch')
        .withArgs('https://addons.mozilla.org/api/v3/internal/accounts/login/?lang=en-US', {
          body: '{"code":"my-code","state":"my-state"}',
          credentials: 'include',
          headers: { 'Content-type': 'application/json' },
          method: 'post',
        })
        .once()
        .returns(mockResponse());
      return api.login({ api: { lang: 'en-US' }, code: 'my-code', state: 'my-state' })
        .then((apiResponse) => {
          assert.strictEqual(apiResponse, response);
          mockWindow.verify();
        });
    });
  });

  describe('fetchProfile', () => {
    it("requests the user's profile", () => {
      const token = 'the.jwt.string';
      const user = { username: 'foo', email: 'foo@example.com' };
      mockWindow
        .expects('fetch')
        .withArgs('https://addons.mozilla.org/api/v3/accounts/profile/?lang=en-US', {
          headers: { authorization: `Bearer ${token}` },
          method: 'get',
        })
        .once()
        .returns(Promise.resolve({
          ok: true,
          json() { return user; },
        }));
      return api.fetchProfile({ api: { lang: 'en-US', token } })
        .then((apiResponse) => {
          assert.deepEqual(apiResponse, { entities: { users: { foo: user } }, result: 'foo' });
          mockWindow.verify();
        });
    });
  });
});
