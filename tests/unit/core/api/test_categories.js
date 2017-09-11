/* global window */
import config from 'config';

import { categories } from 'core/api/categories';
import { CLIENT_APP_ANDROID } from 'core/constants';
import { createApiResponse } from 'tests/unit/helpers';


describe(__filename, () => {
  let mockWindow;
  const apiHost = config.get('apiHost');

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  function mockResponse(responseProps = {}) {
    return createApiResponse({
      jsonData: {
        results: [
          { slug: 'foo' },
          { slug: 'food' },
          { slug: 'football' },
        ],
      },
      ...responseProps,
    });
  }

  it('sets the lang and calls the right API endpoint', () => {
    mockWindow.expects('fetch')
      .withArgs(
        `${apiHost}/api/v3/addons/categories/?lang=en-US`)
      .once()
      .returns(mockResponse());
    return categories({
      api: { clientApp: CLIENT_APP_ANDROID, lang: 'en-US' },
    })
      .then(() => mockWindow.verify());
  });
});
