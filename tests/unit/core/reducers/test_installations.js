import { setInstallState } from 'core/actions/installations';
import {
  DISABLED,
  DOWNLOADING,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  INSTALL_CANCELLED,
  INSTALL_COMPLETE,
  INSTALL_ERROR,
  INSTALLED,
  INSTALLING,
  START_DOWNLOAD,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  UNINSTALL_COMPLETE,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import installations from 'core/reducers/installations';

describe('installations reducer', () => {
  it('is an empty object by default', () => {
    expect(installations(undefined, { type: 'whatever' })).toEqual({});
  });

  it('ignored unknown actions', () => {
    const state = {};
    expect(installations(state, { type: 'whatever' })).toBe(state);
  });

  it('adds an add-on to state', () => {
    expect(installations(undefined, setInstallState({
      guid: 'my-addon@me.com',
      url: 'https://cdn.amo/download/my-addon.xpi',
      status: UNINSTALLED,
    }))).toEqual({
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
    expect(installations(undefined, setInstallState({
      guid: 'my-addon@me.com',
      url: 'https://cdn.amo/download/my-addon.xpi',
      status: UNINSTALLING,
      needsRestart: true,
    }))).toEqual({
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

  it('handles ENABLED add-ons', () => {
    expect(installations(undefined, setInstallState({
      guid: 'my-addon@me.com',
      status: ENABLED,
    }))).toEqual({
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

  it('handles DISABLED add-ons', () => {
    expect(installations(undefined, setInstallState({
      guid: 'my-addon@me.com',
      status: DISABLED,
    }))).toEqual({
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
    expect(installations(undefined, setInstallState({
      guid: 'an-addon@me.com',
      url: 'https://cdn.amo/download/an-addon.xpi',
      status: INSTALLED,
    }))).toEqual({
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
    expect(installations(state, {
      type: START_DOWNLOAD,
      payload: {
        guid: 'my-addon@me.com',
      },
    })).toEqual({
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
    expect(installations(state, {
      type: DOWNLOAD_PROGRESS,
      payload: {
        guid: 'my-addon@me.com',
        downloadProgress: 25,
      },
    })).toEqual({
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
    expect(installations(state, {
      type: INSTALL_COMPLETE,
      payload: {
        guid: 'my-addon@me.com',
      },
    })).toEqual({
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

    expect(addon.downloadProgress).toEqual(0);
    expect(addon.status).toEqual(UNINSTALLED);
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
    expect(installations(state, {
      type: UNINSTALL_COMPLETE,
      payload: {
        guid: 'my-addon@me.com',
      },
    })).toEqual({
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
    expect(installations(state, {
      type: INSTALL_ERROR,
      payload: {
        guid: 'my-addon@me.com',
        error: 'an-error',
      },
    })).toEqual({
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
    expect(installations(state, {
      type: THEME_PREVIEW,
      payload: {
        guid: 'my-addon@me.com',
        themePreviewNode: 'preview-theme-node',
      },
    })).toEqual({
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
    expect(installations(state, {
      type: THEME_RESET_PREVIEW,
      payload: {
        guid: 'my-addon@me.com',
      },
    })).toEqual({
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        isPreviewingTheme: false,
      },
    });
  });

  it('cannot update a non-existant add-on', () => {
    expect(() => installations({}, {
      type: INSTALL_ERROR,
      payload: {
        guid: 'my-addon@me.com',
        error: 'an-error',
      },
    })).toThrowError(/no add-on with guid my-addon@me.com found/);
  });
});
