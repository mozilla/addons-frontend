/* global window */

import getInstallData from 'disco/tracking';
import { DISCO_DATA_UNKNOWN } from 'disco/constants';


describe('disco pane install tracking data', () => {
  function getFakeWindow(hash) {
    return {
      decodeURIComponent: window.decodeURIComponent,
      location: {
        hash: `#${encodeURIComponent(hash)}`,
      },
    };
  }

  it('detects user has themes', () => {
    const _window = getFakeWindow('{"blah": {"type": "theme"}}');
    const result = getInstallData({ _window });
    assert.deepEqual(getInstallData({ _window }), {
      hasExtensions: false,
      hasThemes: true,
    }, sinon.format(result));
  });

  it('detects user has extensions', () => {
    const _window = getFakeWindow('{"blah": {"type": "extension"}}');
    const result = getInstallData({ _window });
    assert.deepEqual(getInstallData({ _window }), {
      hasExtensions: true,
      hasThemes: false,
    }, sinon.format(result));
  });

  it('ignores the default theme', () => {
    const _window = getFakeWindow('{"{972ce4c6-7e08-4474-a285-3208198ce6fd}": {"type": "theme"}}');
    const result = getInstallData({ _window });
    assert.deepEqual(result, {
      hasExtensions: false,
      hasThemes: false,
    }, sinon.format(result));
  });

  it('ignores built in extensions', () => {
    const _window = getFakeWindow('{"firefox@getpocket.com": {"type": "extension"}}');
    const result = getInstallData({ _window });
    assert.deepEqual(result, {
      hasExtensions: false,
      hasThemes: false,
    }, sinon.format(result));
  });

  it('ignores data with no type', () => {
    const _window = getFakeWindow('{"foo": {}}');
    const result = getInstallData({ _window });
    assert.deepEqual(result, {
      hasExtensions: false,
      hasThemes: false,
    }, sinon.format(result));
  });

  it('falls back to "unknown" when data is not present', () => {
    const _window = getFakeWindow('');
    const result = getInstallData({ _window });
    assert.deepEqual(result, {
      hasExtensions: DISCO_DATA_UNKNOWN,
      hasThemes: DISCO_DATA_UNKNOWN,
    }, sinon.format(result));
  });

  it('falls back to "unknown" when JSON cannot be parsed', () => {
    const _window = getFakeWindow('{{"what"}');
    const result = getInstallData({ _window });
    assert.deepEqual(result, {
      hasExtensions: DISCO_DATA_UNKNOWN,
      hasThemes: DISCO_DATA_UNKNOWN,
    }, sinon.format(result));
  });
});

