/* global window */

import getInstallData from 'disco/tracking';
import { DISCO_DATA_UNKNOWN } from 'disco/constants';

describe(__filename, () => {
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
    expect(getInstallData({ _window })).toEqual({
      hasExtensions: false,
      hasThemes: true,
    });
  });

  it('detects user has extensions', () => {
    const _window = getFakeWindow('{"blah": {"type": "extension"}}');
    expect(getInstallData({ _window })).toEqual({
      hasExtensions: true,
      hasThemes: false,
    });
  });

  it('ignores the default theme', () => {
    const _window = getFakeWindow(
      '{"{972ce4c6-7e08-4474-a285-3208198ce6fd}": {"type": "theme"}}',
    );
    expect(getInstallData({ _window })).toEqual({
      hasExtensions: false,
      hasThemes: false,
    });
  });

  it('ignores built in extensions', () => {
    const _window = getFakeWindow(
      '{"firefox@getpocket.com": {"type": "extension"}}',
    );
    expect(getInstallData({ _window })).toEqual({
      hasExtensions: false,
      hasThemes: false,
    });
  });

  it('ignores data with no type', () => {
    const _window = getFakeWindow('{"foo": {}}');
    expect(getInstallData({ _window })).toEqual({
      hasExtensions: false,
      hasThemes: false,
    });
  });

  it('falls back to "unknown" when data is not present', () => {
    const _window = getFakeWindow('');
    expect(getInstallData({ _window })).toEqual({
      hasExtensions: DISCO_DATA_UNKNOWN,
      hasThemes: DISCO_DATA_UNKNOWN,
    });
  });

  it('falls back to "unknown" when JSON cannot be parsed', () => {
    const _window = getFakeWindow('{{"what"}');
    expect(getInstallData({ _window })).toEqual({
      hasExtensions: DISCO_DATA_UNKNOWN,
      hasThemes: DISCO_DATA_UNKNOWN,
    });
  });
});
