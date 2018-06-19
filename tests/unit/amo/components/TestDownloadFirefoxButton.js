import * as React from 'react';

import DownloadFirefoxButton, {
  DownloadFirefoxButtonBase,
} from 'amo/components/DownloadFirefoxButton';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget, userAgents } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    const { store } = dispatchClientMetadata();

    return shallowUntilTarget(
      <DownloadFirefoxButton i18n={fakeI18n()} store={store} {...props} />,
      DownloadFirefoxButtonBase,
    );
  }

  it('renders nothing if the browser is Firefox Desktop', () => {
    const { store } = dispatchClientMetadata({
      userAgent: userAgents.firefoxAndroid[0],
    });
    const root = render({ store });

    expect(root.find('.DownloadFirefoxButton')).toHaveLength(0);
  });

  it('renders nothing if the browser is Firefox for Android', () => {
    const { store } = dispatchClientMetadata({
      userAgent: userAgents.firefoxAndroid[0],
    });
    const root = render({ store });

    expect(root.find('.DownloadFirefoxButton')).toHaveLength(0);
  });

  it('renders nothing if the browser is Firefox for iOS', () => {
    const { store } = dispatchClientMetadata({
      userAgent: userAgents.firefoxIOS[0],
    });
    const root = render({ store });

    expect(root.find('.DownloadFirefoxButton')).toHaveLength(0);
  });

  it('renders a DownloadFirefoxButton if the browser is not Firefox', () => {
    const { store } = dispatchClientMetadata({
      userAgent: userAgents.chrome[0],
    });
    const root = render({ store });

    expect(root).toHaveClassName('DownloadFirefoxButton');
    expect(root).toHaveProp(
      'href',
      [
        'https://www.mozilla.org/firefox/new/',
        '?utm_source=addons.mozilla.org',
        '&utm_medium=referral',
        '&utm_campaign=non-fx-button',
        '&utm_content=header-download-button',
      ].join(''),
    );
  });
});
