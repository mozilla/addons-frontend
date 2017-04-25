import {
  DISABLED,
  DOWNLOADING,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  INSTALL_CANCELLED,
  INSTALL_COMPLETE,
  INSTALL_ERROR,
  INSTALL_STATE,
  INSTALLED,
  INSTALLING,
  START_DOWNLOAD,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  UNINSTALL_COMPLETE,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import installations, { loadAddon } from 'core/reducers/installations';

describe('installations reducer', () => {
  it('is an empty object by default', () => {
    assert.deepEqual(installations(undefined, { type: 'whatever' }), {});
  });

  it('ignored unknown actions', () => {
    const state = {};
    assert.strictEqual(installations(state, { type: 'whatever' }), state);
  });

  it('adds an add-on on INSTALL_STATE', () => {
    assert.deepEqual(
      installations(undefined, {
        type: INSTALL_STATE,
        payload: {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          status: UNINSTALLED,
        },
      }),
      {
        'my-addon@me.com': {
          downloadProgress: 0,
          error: undefined,
          guid: 'my-addon@me.com',
          needsRestart: false,
          status: UNINSTALLED,
          url: 'https://cdn.amo/download/my-addon.xpi',
        },
      });
  });

  it('passes down needsRestart=true', () => {
    assert.deepEqual(
      installations(undefined, {
        type: INSTALL_STATE,
        payload: {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          status: UNINSTALLING,
          needsRestart: true,
        },
      }),
      {
        'my-addon@me.com': {
          downloadProgress: 0,
          error: undefined,
          guid: 'my-addon@me.com',
          needsRestart: true,
          status: UNINSTALLING,
          url: 'https://cdn.amo/download/my-addon.xpi',
        },
      });
  });

  it('handles ENABLED status in INSTALL_STATE', () => {
    assert.deepEqual(
      installations(undefined, {
        type: 'INSTALL_STATE',
        payload: {
          guid: 'my-addon@me.com',
          status: ENABLED,
        },
      }),
      {
        'my-addon@me.com': {
          downloadProgress: 0,
          error: undefined,
          guid: 'my-addon@me.com',
          needsRestart: false,
          status: ENABLED,
          url: undefined,
        },
      });
  });

  it('handles DISABLED status in INSTALL_STATE', () => {
    assert.deepEqual(
      installations(undefined, {
        type: 'INSTALL_STATE',
        payload: {
          guid: 'my-addon@me.com',
          status: DISABLED,
        },
      }),
      {
        'my-addon@me.com': {
          downloadProgress: 0,
          error: undefined,
          guid: 'my-addon@me.com',
          needsRestart: false,
          status: DISABLED,
          url: undefined,
        },
      });
  });

  it('uses the add-ons status', () => {
    assert.deepEqual(
      installations(undefined, {
        type: INSTALL_STATE,
        payload: {
          guid: 'an-addon@me.com',
          url: 'https://cdn.amo/download/an-addon.xpi',
          status: INSTALLED,
        },
      }),
      {
        'an-addon@me.com': {
          downloadProgress: 0,
          error: undefined,
          guid: 'an-addon@me.com',
          needsRestart: false,
          status: INSTALLED,
          url: 'https://cdn.amo/download/an-addon.xpi',
        },
      });
  });

  it('marks an add-on as installing on START_DOWNLOAD', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 0,
        status: UNINSTALLED,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: START_DOWNLOAD,
        payload: {
          guid: 'my-addon@me.com',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 0,
          status: DOWNLOADING,
        },
      });
  });

  it('updates the downloadProgress on DOWNLOAD_PROGRESS', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 0,
        status: DOWNLOADING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: DOWNLOAD_PROGRESS,
        payload: {
          guid: 'my-addon@me.com',
          downloadProgress: 25,
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 25,
          status: DOWNLOADING,
        },
      });
  });

  it('updates the status on INSTALL_COMPLETE', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 100,
        status: INSTALLING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: INSTALL_COMPLETE,
        payload: {
          guid: 'my-addon@me.com',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 100,
          status: INSTALLED,
        },
      });
  });

  it('updates the status on INSTALL_CANCELLED', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 100,
        status: DOWNLOAD_PROGRESS,
      },
    };
    const installationsState = installations(state, {
      type: INSTALL_CANCELLED,
      payload: { guid: 'my-addon@me.com' },
    });
    const addon = installationsState['my-addon@me.com'];

    assert.equal(addon.downloadProgress, 0);
    assert.equal(addon.status, UNINSTALLED);
  });

  it('updates the status on UNINSTALL_COMPLETE', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 0,
        status: UNINSTALLING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: UNINSTALL_COMPLETE,
        payload: {
          guid: 'my-addon@me.com',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 0,
          status: UNINSTALLED,
        },
      });
  });

  it('sets an error on INSTALL_ERROR', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 55,
        status: DOWNLOADING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: INSTALL_ERROR,
        payload: {
          guid: 'my-addon@me.com',
          error: 'an-error',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 0,
          status: ERROR,
          error: 'an-error',
        },
      });
  });

  it('sets isPreviewingTheme and themePreviewNode', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
      },
    };
    assert.deepEqual(
      installations(state, {
        type: THEME_PREVIEW,
        payload: {
          guid: 'my-addon@me.com',
          themePreviewNode: 'preview-theme-node',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          themePreviewNode: 'preview-theme-node',
          isPreviewingTheme: true,
        },
      });
  });

  it('unsets isPreviewingTheme', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
      },
    };
    assert.deepEqual(
      installations(state, {
        type: THEME_RESET_PREVIEW,
        payload: {
          guid: 'my-addon@me.com',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          isPreviewingTheme: false,
        },
      });
  });
});

describe('installations loadAddon', () => {
  it('returns null when no add-on found', () => {
    const addon = loadAddon({ guid: '302', state: {} });
    assert.equal(addon, null);
  });
});
