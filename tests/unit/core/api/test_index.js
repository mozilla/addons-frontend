/* global window */
import config from 'config';
import utf8 from 'utf8';

import { callApi, createApiError, makeQueryString } from 'core/api';
import {
  createApiResponse,
  createStubErrorHandler,
  generateHeaders,
  unexpectedSuccess,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let mockWindow;
  const apiHost = config.get('apiHost');

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  describe('core.callApi', () => {
    it('does not use remote host for api calls', () => {
      expect(apiHost).toEqual('https://localhost');
    });

    it('transforms method to upper case', () => {
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/resource/`, {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(createApiResponse());
      return callApi({ endpoint: 'resource', method: 'get' })
        .then(() => mockWindow.verify());
    });

    it('encodes non-ascii URLs in UTF8', () => {
      const endpoint = 'diccionario-español-venezuela';
      mockWindow.expects('fetch')
        .withArgs(utf8.encode(`${apiHost}/api/v3/${endpoint}/`), {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(createApiResponse());
      return callApi({ endpoint }).then(() => mockWindow.verify());
    });

    it('clears an error handler before making a request', () => {
      mockWindow.expects('fetch').returns(createApiResponse());

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'clear');

      return callApi({ endpoint: 'resource', errorHandler })
        .then(() => {
          expect(errorHandler.clear.called).toBeTruthy();
        });
    });

    it('passes errors to the error handler', () => {
      const nonFieldErrors = ['user_id and password cannot be blank'];
      mockWindow.expects('fetch').returns(createApiResponse({
        ok: false,
        jsonData: { non_field_errors: nonFieldErrors },
      }));

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'handle');

      return callApi({ endpoint: 'resource', errorHandler })
        .then(unexpectedSuccess, () => {
          expect(errorHandler.handle.called).toBeTruthy();
          const args = errorHandler.handle.firstCall.args;
          expect(args[0].response.data.non_field_errors).toEqual(nonFieldErrors);
        });
    });

    it('handles error responses with JSON syntax errors', () => {
      mockWindow.expects('fetch').returns(createApiResponse({
        json() {
          return Promise.reject(
            new SyntaxError('pretend this was a response with invalid JSON'));
        },
      }));

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'handle');

      return callApi({ endpoint: 'resource' })
        .then(unexpectedSuccess, (err) => {
          expect(err.message).toEqual('pretend this was a response with invalid JSON');
        });
    });

    it('handles non-JSON responses', () => {
      mockWindow.expects('fetch').returns(createApiResponse({
        headers: generateHeaders({ 'Content-Type': 'text/plain' }),
        text() {
          return Promise.resolve('some text response');
        },
      }));

      return callApi({ endpoint: 'resource' })
        .then((responseData) => {
          mockWindow.verify();
          expect(responseData).toEqual({});
        });
    });

    it('handles any fetch error', () => {
      mockWindow.expects('fetch').returns(Promise.reject(new Error(
        'this could be any error'
      )));

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'handle');

      return callApi({ endpoint: 'resource', errorHandler })
        .then(unexpectedSuccess, () => {
          expect(errorHandler.handle.called).toBeTruthy();
          const args = errorHandler.handle.firstCall.args;
          expect(args[0].message).toEqual('this could be any error');
        });
    });

    it('handles an oddly-cased Content-Type', () => {
      const response = createApiResponse({
        headers: generateHeaders({ 'Content-Type': 'Application/JSON' }),
      });

      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/resource/`, {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(response);
      return callApi({ endpoint: 'resource', method: 'GET' })
        .then(() => mockWindow.verify());
    });
  });

  describe('makeQueryString', () => {
    it('transforms an object to a query string', () => {
      const query = makeQueryString({ user: 123, addon: 321 });
      expect(query).toContain('user=123');
      expect(query).toContain('addon=321');
    });

    it('ignores undefined query string values', () => {
      const query = makeQueryString({ user: undefined, addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('ignores null query string values', () => {
      const query = makeQueryString({ user: null, addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('ignores empty string query string values', () => {
      const query = makeQueryString({ user: '', addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('handles falsey integers', () => {
      const query = makeQueryString({ some_flag: 0 });
      expect(query).toEqual('?some_flag=0');
    });

    it('handles truthy integers', () => {
      const query = makeQueryString({ some_flag: 1 });
      expect(query).toEqual('?some_flag=1');
    });

    it('handles false values', () => {
      const query = makeQueryString({ some_flag: false });
      expect(query).toEqual('?some_flag=false');
    });

    it('handles true values', () => {
      const query = makeQueryString({ some_flag: true });
      expect(query).toEqual('?some_flag=true');
    });
  });

  describe('createApiError', () => {
    function _createApiError({
      response = { status: 500 }, ...params } = {}
    ) {
      return createApiError({ response, ...params });
    }

    it('includes an abbreviated URL', () => {
      const error = _createApiError({
        apiURL: `${config.get('apiHost')}/api/v3/addons/addon/123/`,
      });
      expect(error.message)
        .toMatch(new RegExp('Error calling: /api/v3/addons/addon/123/'));
    });

    it('strips query params from the abbreviated URL', () => {
      const error = _createApiError({
        apiURL: `${config.get('apiHost')}/api/resource/?lang=en-US`,
      });
      // Add a space at the end of the URL to make sure the query string
      // isn't there.
      expect(error.message).toMatch(new RegExp('/api/resource/ '));
    });

    it('copes with a missing API URL', () => {
      const error = _createApiError();
      expect(error.message).toMatch(/Error calling: \[unknown URL\]/);
    });

    it('includes response status in the error message', () => {
      const error = _createApiError({
        apiURL: `${config.get('apiHost')}/api/resource/`,
        response: { status: 422 },
      });
      expect(error.message)
        .toEqual('Error calling: /api/resource/ (status: 422)');
    });
  });
});
