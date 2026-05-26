/* global window */
import { injectUTMParams, removeUTMParams } from 'amo/utils/installAttribution';
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'amo/constants';

describe(__filename, () => {
  let replaceStateSpy;

  beforeEach(() => {
    replaceStateSpy = jest.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    replaceStateSpy.mockRestore();
    // Return window.location to a clean root path.
    window.history.replaceState(null, '', 'http://localhost/');
  });

  describe('injectUTMParams', () => {
    it('injects UTM parameters when none are present', () => {
      window.history.replaceState(
        null,
        '',
        'http://localhost/en-US/firefox/addon/some-slug/',
      );
      replaceStateSpy.mockClear();

      injectUTMParams('featured-shelf');

      expect(replaceStateSpy).toHaveBeenCalled();
      const lastCallUrl =
        replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1][2];
      const url = new URL(lastCallUrl);
      expect(url.searchParams.get('utm_source')).toEqual(DEFAULT_UTM_SOURCE);
      expect(url.searchParams.get('utm_medium')).toEqual(DEFAULT_UTM_MEDIUM);
      expect(url.searchParams.get('utm_content')).toEqual('featured-shelf');
    });

    it('does not overwrite existing external UTM parameters', () => {
      window.history.replaceState(
        null,
        '',
        'http://localhost/en-US/firefox/addon/some-slug/?utm_source=external-source&utm_medium=external-medium',
      );
      replaceStateSpy.mockClear();

      injectUTMParams('featured-shelf');

      expect(replaceStateSpy).not.toHaveBeenCalled();
    });
  });

  describe('removeUTMParams', () => {
    it('removes injected UTM parameters when utm_source matches DEFAULT_UTM_SOURCE', () => {
      window.history.replaceState(
        null,
        '',
        `http://localhost/en-US/firefox/addon/some-slug/?utm_source=${DEFAULT_UTM_SOURCE}&utm_medium=${DEFAULT_UTM_MEDIUM}&utm_content=featured-shelf`,
      );
      replaceStateSpy.mockClear();

      removeUTMParams();

      expect(replaceStateSpy).toHaveBeenCalled();
      const lastCallUrl =
        replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1][2];
      const url = new URL(lastCallUrl);
      expect(url.searchParams.has('utm_source')).toBe(false);
      expect(url.searchParams.has('utm_medium')).toBe(false);
      expect(url.searchParams.has('utm_content')).toBe(false);
    });

    it('does not remove external UTM parameters', () => {
      window.history.replaceState(
        null,
        '',
        'http://localhost/en-US/firefox/addon/some-slug/?utm_source=external-source&utm_medium=external-medium&utm_content=external-content',
      );
      replaceStateSpy.mockClear();

      removeUTMParams();

      expect(replaceStateSpy).not.toHaveBeenCalled();
    });
  });
});
