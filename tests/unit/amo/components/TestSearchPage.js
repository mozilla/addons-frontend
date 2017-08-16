import { mapStateToProps } from 'amo/components/SearchPage';
import { CLIENT_APP_ANDROID } from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  describe('mapStateToProps()', () => {
    const { state } = dispatchClientMetadata();
    const location = {
      query: {
        page: 2,
        q: 'burger',
      },
    };

    it('returns filters based on location (URL) data', () => {
      expect(mapStateToProps(state, { location })).toEqual({
        filters: {
          clientApp: CLIENT_APP_ANDROID,
          page: 2,
          query: 'burger',
        },
      });
    });
  });
});
