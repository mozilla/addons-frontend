import React from 'react';

import DownloadFirefoxButton, {
  DownloadFirefoxButtonBase,
  mapStateToProps,
} from 'amo/components/DownloadFirefoxButton';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  getFakeI18nInst,
  shallowUntilTarget,
  userAgents,
} from 'tests/unit/helpers';


describe(__filename, () => {
  function render({
    userAgent = userAgents.firefox[0],
    ...props
  } = {}) {
    const { store } = dispatchClientMetadata({ userAgent });

    return shallowUntilTarget(
      <DownloadFirefoxButton
        i18n={getFakeI18nInst()}
        store={store}
        {...props}
      />,
      DownloadFirefoxButtonBase,
    );
  }

  it('renders nothing if the browser is Firefox Desktop', () => {
    const root = render();

    expect(root.find('.DownloadFirefoxButton')).toHaveLength(0);
  });

  it('renders nothing if the browser is Firefox for Android', () => {
    const root = render({ userAgent: userAgents.firefoxAndroid[0] });

    expect(root.find('.DownloadFirefoxButton')).toHaveLength(0);
  });

  it('renders nothing if the browser is Firefox for iOS', () => {
    const root = render({ userAgent: userAgents.firefoxIOS[0] });

    expect(root.find('.DownloadFirefoxButton')).toHaveLength(0);
  });

  it('renders a DownloadFirefoxButton if the browser is not Firefox', () => {
    const root = render({ userAgent: userAgents.chrome[0] });

    expect(root).toHaveClassName('DownloadFirefoxButton');
  });

  describe('mapStateToProps', () => {
    it('returns the userAgentInfo', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefoxIOS[1],
      });

      expect(mapStateToProps(store.getState()).userAgentInfo).toMatchObject({
        browser: { name: 'Firefox' },
        os: { name: 'iOS' },
      });
    });
  });
});
