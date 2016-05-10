import {
  DOWNLOADING,
  ERROR,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
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
        type: 'INSTALL_STATE',
        payload: {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          state: UNINSTALLED,
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 0,
          state: UNINSTALLED,
        },
      });
  });

  it('uses the add-ons state', () => {
    assert.deepEqual(
      installations(undefined, {
        type: 'INSTALL_STATE',
        payload: {
          slug: 'an-addon',
          guid: 'an-addon@me.com',
          url: 'https://cdn.amo/download/an-addon.xpi',
          state: INSTALLED,
        },
      }),
      {
        'an-addon': {
          slug: 'an-addon',
          guid: 'an-addon@me.com',
          url: 'https://cdn.amo/download/an-addon.xpi',
          progress: 0,
          state: INSTALLED,
        },
      });
  });

  it('marks an add-on as installing on START_DOWNLOAD', () => {
    const state = {
      'my-addon': {
        slug: 'my-addon',
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        progress: 0,
        state: UNINSTALLED,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: 'START_DOWNLOAD',
        payload: {
          slug: 'my-addon',
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 0,
          state: DOWNLOADING,
        },
      });
  });

  it('updates the download progress on DOWNLOAD_PROGRESS', () => {
    const state = {
      'my-addon': {
        slug: 'my-addon',
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        progress: 0,
        state: DOWNLOADING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: 'DOWNLOAD_PROGRESS',
        payload: {
          slug: 'my-addon',
          progress: 25,
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 25,
          state: DOWNLOADING,
        },
      });
  });

  it('updates the state and progress on START_INSTALL', () => {
    const state = {
      'my-addon': {
        slug: 'my-addon',
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        progress: 75,
        state: DOWNLOADING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: 'START_INSTALL',
        payload: {
          slug: 'my-addon',
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 100,
          state: INSTALLING,
        },
      });
  });

  it('updates the state INSTALL_COMPLETE', () => {
    const state = {
      'my-addon': {
        slug: 'my-addon',
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        progress: 100,
        state: INSTALLING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: 'INSTALL_COMPLETE',
        payload: {
          slug: 'my-addon',
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 100,
          state: INSTALLED,
        },
      });
  });

  it('updates the state on START_UNINSTALL', () => {
    const state = {
      'my-addon': {
        slug: 'my-addon',
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        progress: 100,
        state: INSTALLED,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: 'START_UNINSTALL',
        payload: {
          slug: 'my-addon',
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 0,
          state: UNINSTALLING,
        },
      });
  });

  it('updates the state on UNINSTALL_COMPLETE', () => {
    const state = {
      'my-addon': {
        slug: 'my-addon',
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        progress: 0,
        state: UNINSTALLING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: 'UNINSTALL_COMPLETE',
        payload: {
          slug: 'my-addon',
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 0,
          state: UNINSTALLED,
        },
      });
  });

  it('sets an error on INSTALL_ERROR', () => {
    const state = {
      'my-addon': {
        slug: 'my-addon',
        guid: 'my-addon@me.com',
        url: 'https://cdn.amo/download/my-addon.xpi',
        progress: 55,
        state: DOWNLOADING,
      },
    };
    assert.deepEqual(
      installations(state, {
        type: 'INSTALL_ERROR',
        payload: {
          slug: 'my-addon',
          error: 'Download interrupted, check your network connection.',
        },
      }),
      {
        'my-addon': {
          slug: 'my-addon',
          guid: 'my-addon@me.com',
          url: 'https://cdn.amo/download/my-addon.xpi',
          progress: 0,
          state: ERROR,
          error: 'Download interrupted, check your network connection.',
        },
      });
  });
});
