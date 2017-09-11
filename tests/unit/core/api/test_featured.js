/* global window */
import config from 'config';

import { featured } from 'core/api/featured';
import { ADDON_TYPE_THEME, CLIENT_APP_ANDROID } from 'core/constants';
import { createApiResponse } from 'tests/unit/helpers';


describe(__filename, () => {
  const apiHost = config.get('apiHost');
  let mockWindow;

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  const mockResponse = () => createApiResponse({
    jsonData: {
      results: [
        { slug: 'foo' },
        { slug: 'food' },
        { slug: 'football' },
      ],
    },
  });

  it('sets the app, lang, and type query', () => {
    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/featured/?app=android&type=persona&lang=en-US`)
      .once()
      .returns(mockResponse());
    return featured({
      api: { clientApp: CLIENT_APP_ANDROID, lang: 'en-US' },
      filters: { addonType: ADDON_TYPE_THEME },
    })
      .then((response) => {
        expect(response).toEqual({
          entities: {
            addons: {
              foo: { slug: 'foo' },
              food: { slug: 'food' },
              football: { slug: 'football' },
            },
          },
          result: {
            results: ['foo', 'food', 'football'],
          },
        });
        return mockWindow.verify();
      });
  });
});
