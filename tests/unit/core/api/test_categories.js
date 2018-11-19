/* global window */
import config from 'config';

import * as api from 'core/api/categories';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  let mockWindow;
  const apiVersion = config.get('apiVersion');

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  describe('getCategories', () => {
    function mockResponse(responseProps = {}) {
      return createApiResponse({
        jsonData: {
          results: [{ slug: 'foo' }, { slug: 'food' }, { slug: 'football' }],
        },
        ...responseProps,
      });
    }

    it('calls the right API endpoint', async () => {
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${apiVersion}/addons/categories/`))
        .returns(mockResponse());

      await api.getCategories({ api: dispatchClientMetadata().state.api });
      mockWindow.verify();
    });
  });
});
