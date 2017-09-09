/* global window */
import config from 'config';

import { fetchAddon } from 'core/api/addon';
import {
  createApiResponse,
  unexpectedSuccess,
  userAuthToken,
} from 'tests/unit/helpers';


describe(__filename, () => {
  const apiHost = config.get('apiHost');
  let mockWindow;

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  function mockResponse(responseProps = {}) {
    return createApiResponse({
      jsonData: {
        name: 'Foo!',
        slug: 'foo',
      },
      ...responseProps,
    });
  }

  it('sets the lang and slug', () => {
    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/addon/foo/?lang=en-US`, {
        body: undefined,
        credentials: undefined,
        headers: {},
        method: 'GET',
      })
      .once()
      .returns(mockResponse());
    return fetchAddon({ api: { lang: 'en-US' }, slug: 'foo' })
      .then(() => mockWindow.verify());
  });

  it('normalizes the response', () => {
    mockWindow.expects('fetch').once().returns(mockResponse());
    return fetchAddon('foo')
      .then((results) => {
        const foo = { slug: 'foo', name: 'Foo!' };
        expect(results.result).toEqual('foo');
        expect(results.entities).toEqual({ addons: { foo } });
      });
  });

  it('fails when the add-on is not found', () => {
    mockWindow
      .expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/addon/foo/?lang=en-US`, {
        body: undefined,
        credentials: undefined,
        headers: {},
        method: 'GET',
      })
      .once()
      .returns(mockResponse({ ok: false }));
    return fetchAddon({ api: { lang: 'en-US' }, slug: 'foo' })
      .then(unexpectedSuccess,
        (error) => {
          expect(error.message)
            .toMatch(new RegExp('Error calling: /api/v3/addons/addon/foo/'));
        });
  });

  it('includes the authorization token if available', () => {
    const token = userAuthToken();
    mockWindow
      .expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/addon/bar/?lang=en-US`, {
        body: undefined,
        credentials: undefined,
        headers: { authorization: `Bearer ${token}` },
        method: 'GET',
      })
      .once()
      .returns(mockResponse());
    return fetchAddon({ api: { lang: 'en-US', token }, slug: 'bar' })
      .then((results) => {
        const foo = { slug: 'foo', name: 'Foo!' };
        expect(results.result).toEqual('foo');
        expect(results.entities).toEqual({ addons: { foo } });
        mockWindow.verify();
      });
  });
});
