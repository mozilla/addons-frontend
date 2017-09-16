/* global window */
import config from 'config';

import { reportAddon } from 'core/api/abuse';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createApiResponse,
  createFakeAddonAbuseReport,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let api;
  let mockWindow;
  const apiHost = config.get('apiHost');

  beforeEach(() => {
    api = dispatchSignInActions().store.getState().api;
    mockWindow = sinon.mock(window);
  });

  describe('reportAddon', () => {
    function _reportAddon(extraArguments = {}) {
      return reportAddon({
        api,
        auth: true,
        ...extraArguments,
      });
    }

    function mockResponse({ addon, message }) {
      return createApiResponse({
        jsonData: createFakeAddonAbuseReport({ addon, message }),
      });
    }

    it('should allow anonymous users to report an add-on', () => {
      const message = 'I do not like this!';

      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/abuse/report/addon/?addon=cool-addon&message=I%20do%20not%20like%20this!&lang=en-US`)
        .once()
        .returns(mockResponse({
          addon: { ...fakeAddon, slug: 'cool-addon' },
          message,
        }));
      return _reportAddon({ addon: 'cool-addon', api, message })
        .then(() => mockWindow.verify());
    });

    it('should allow signed-in users to report an add-on', () => {
      const message = 'I bet everybody here is fake happy too.';

      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/abuse/report/addon/?addon=cool-addon&message=I%20bet%20everybody%20here%20is%20fake%20happy%20too.&lang=en-US`)
        .once()
        .returns(mockResponse({
          addon: { ...fakeAddon, slug: 'cool-addon' },
          message,
        }));
      return _reportAddon({ addon: 'cool-addon', message })
        .then(() => mockWindow.verify());
    });
  });
});
