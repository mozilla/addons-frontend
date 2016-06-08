import {
  DOWNLOADING,
  DOWNLOAD_PROGRESS,
  ERROR,
  INSTALLED,
  INSTALL_COMPLETE,
  INSTALL_ERROR,
  INSTALL_STATE,
  INSTALLING,
  START_DOWNLOAD,
  START_INSTALL,
  START_UNINSTALL,
  UNINSTALLED,
  UNINSTALL_COMPLETE,
  UNINSTALLING,
} from 'disco/constants';
import installations from 'disco/reducers/installations';

describe('installations reducer', () => {
  it('is an empty object by default', () => {
    assert.deepEqual(installations(undefined, {type: 'whatever'}), {});
  });

  it('ignored unknown actions', () => {
    const state = {};
    assert.strictEqual(installations(state, {type: 'whatever'}), state);
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
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 0,
          status: UNINSTALLED,
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
          guid: 'an-addon@me.com',
          url: 'https://cdn.amo/download/an-addon.xpi',
          downloadProgress: 0,
          status: INSTALLED,
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

  it('updates the status and downloadProgress on START_INSTALL', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 75,
        status: DOWNLOADING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: START_INSTALL,
        payload: {
          guid: 'my-addon@me.com',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 100,
          status: INSTALLING,
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

  it('updates the status on START_UNINSTALL', () => {
    const state = {
      'my-addon@me.com': {
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        downloadProgress: 100,
        status: INSTALLED,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: START_UNINSTALL,
        payload: {
          guid: 'my-addon@me.com',
        },
      }),
      {
        'my-addon@me.com': {
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          downloadProgress: 0,
          status: UNINSTALLING,
        },
      });
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
});
