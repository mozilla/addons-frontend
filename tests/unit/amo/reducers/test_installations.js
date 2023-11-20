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
  UNINSTALL_COMPLETE,
  UNINSTALLED,
  UNINSTALLING,
} from 'amo/constants';
import installations, { setInstallState } from 'amo/reducers/installations';
import { fakeInstalledAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  it('is an empty object by default', () => {
    expect(installations(undefined, { type: 'whatever' })).toEqual({});
  });

  it('ignored unknown actions', () => {
    const state = {};
    expect(installations(state, { type: 'whatever' })).toBe(state);
  });

  it('adds an add-on to state', () => {
    const guid = 'my-addon@me.com';
    const version = '1.2.3.4';
    const name = 'some name';
    expect(
      installations(
        undefined,
        setInstallState({
          ...fakeInstalledAddon,
          guid,
          url: 'https://addons.cdn.mozilla.net/download/my-addon.xpi',
          status: UNINSTALLED,
          version,
          name,
        }),
      ),
    ).toEqual({
      [guid]: {
        canUninstall: true, // The default value should be `true`.
        downloadProgress: 0,
        error: undefined,
        guid,
        needsRestart: false,
        status: UNINSTALLED,
        url: 'https://addons.cdn.mozilla.net/download/my-addon.xpi',
        version,
        name,
      },
    });
  });

  it('passes down canUninstall when defined', () => {
    const guid = 'my-addon@me.com';
    let canUninstall = true;

    expect(
      installations(
        undefined,
        setInstallState({
          ...fakeInstalledAddon,
          guid,
          canUninstall,
        }),
      ),
    ).toMatchObject({ [guid]: { canUninstall } });

    canUninstall = false;
    expect(
      installations(
        undefined,
        setInstallState({
          ...fakeInstalledAddon,
          guid,
          canUninstall,
        }),
      ),
    ).toMatchObject({ [guid]: { canUninstall } });
  });

  it('passes down needsRestart=true', () => {
    const guid = 'my-addon@me.com';
    expect(
      installations(
        undefined,
        setInstallState({
          ...fakeInstalledAddon,
          guid,
          needsRestart: true,
        }),
      ),
    ).toMatchObject({
      [guid]: {
        needsRestart: true,
      },
    });
  });

  it('handles ENABLED add-ons', () => {
    const guid = 'my-addon@me.com';
    expect(
      installations(
        undefined,
        setInstallState({
          ...fakeInstalledAddon,
          guid,
          status: ENABLED,
        }),
      ),
    ).toMatchObject({
      [guid]: {
        status: ENABLED,
      },
    });
  });

  it('handles DISABLED add-ons', () => {
    const guid = 'my-addon@me.com';
    expect(
      installations(
        undefined,
        setInstallState({
          ...fakeInstalledAddon,
          guid,
          status: DISABLED,
        }),
      ),
    ).toMatchObject({
      [guid]: {
        status: DISABLED,
      },
    });
  });

  it('uses the add-ons status', () => {
    const guid = 'an-addon@me.com';
    expect(
      installations(
        undefined,
        setInstallState({
          ...fakeInstalledAddon,
          guid,
          status: INSTALLED,
        }),
      ),
    ).toMatchObject({
      [guid]: {
        status: INSTALLED,
      },
    });
  });

  it('marks an add-on as installing on START_DOWNLOAD', () => {
    const guid = 'my-addon@me.com';
    const state = installations(
      undefined,
      setInstallState({
        ...fakeInstalledAddon,
        guid,
        status: UNINSTALLED,
      }),
    );

    expect(
      installations(state, {
        type: START_DOWNLOAD,
        payload: { guid },
      }),
    ).toMatchObject({
      [guid]: {
        status: DOWNLOADING,
      },
    });
  });

  it('updates the downloadProgress on DOWNLOAD_PROGRESS', () => {
    const guid = 'my-addon@me.com';
    const state = installations(
      undefined,
      setInstallState({
        ...fakeInstalledAddon,
        guid,
        status: DOWNLOADING,
      }),
    );

    expect(
      installations(state, {
        type: DOWNLOAD_PROGRESS,
        payload: { guid, downloadProgress: 25 },
      }),
    ).toMatchObject({
      [guid]: {
        downloadProgress: 25,
      },
    });
  });

  it('updates the status on INSTALL_COMPLETE', () => {
    const guid = 'my-addon@me.com';
    const state = installations(
      undefined,
      setInstallState({
        ...fakeInstalledAddon,
        guid,
        status: INSTALLING,
      }),
    );

    expect(
      installations(state, {
        type: INSTALL_COMPLETE,
        payload: { guid },
      }),
    ).toMatchObject({
      [guid]: {
        status: INSTALLED,
      },
    });
  });

  it('updates the status on INSTALL_CANCELLED', () => {
    const guid = 'my-addon@me.com';
    const state = installations(
      undefined,
      setInstallState({
        ...fakeInstalledAddon,
        guid,
        status: DOWNLOAD_PROGRESS,
      }),
    );

    expect(
      installations(state, {
        type: INSTALL_CANCELLED,
        payload: { guid },
      }),
    ).toMatchObject({
      [guid]: {
        downloadProgress: 0,
        status: UNINSTALLED,
      },
    });
  });

  it('updates the status on UNINSTALL_COMPLETE', () => {
    const guid = 'my-addon@me.com';
    const state = installations(
      undefined,
      setInstallState({
        ...fakeInstalledAddon,
        guid,
        status: UNINSTALLING,
      }),
    );

    expect(
      installations(state, {
        type: UNINSTALL_COMPLETE,
        payload: { guid },
      }),
    ).toMatchObject({
      [guid]: {
        status: UNINSTALLED,
      },
    });
  });

  it('sets an error on INSTALL_ERROR', () => {
    const guid = 'my-addon@me.com';
    const state = installations(
      undefined,
      setInstallState({
        ...fakeInstalledAddon,
        guid,
        status: DOWNLOADING,
      }),
    );

    expect(
      installations(state, {
        type: INSTALL_ERROR,
        payload: { guid, error: 'an-error' },
      }),
    ).toMatchObject({
      [guid]: {
        status: ERROR,
        error: 'an-error',
      },
    });
  });

  it('cannot update a non-existant add-on', () => {
    expect(() =>
      installations(
        {},
        {
          type: INSTALL_ERROR,
          payload: {
            guid: 'my-addon@me.com',
            error: 'an-error',
          },
        },
      ),
    ).toThrow(/no add-on with guid my-addon@me.com found/);
  });
});
