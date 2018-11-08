import * as React from 'react';

import Link from 'amo/components/Link';
import SuggestedPages, {
  SuggestedPagesBase,
} from 'amo/components/SuggestedPages';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import {
  dispatchClientMetadata,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(
      <SuggestedPages {...allProps} />,
      SuggestedPagesBase,
    );
  };

  it('renders Suggested Pages', () => {
    const wrapper = render();

    expect(wrapper.text()).toContain('Suggested Pages');
    // There should be three links on the page.
    const links = wrapper.find(Link);
    expect(links).toHaveLength(3);

    expect(links.at(0)).toHaveProp('to', '/extensions/');
    expect(links.at(1)).toHaveProp('to', '/themes/');
    expect(links.at(2)).toHaveProp('to', '/');
  });

  it('does not render a "themes" link when clientApp is Android and enableFeatureStaticThemesForAndroid is false', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const _config = getFakeConfig({
      enableFeatureStaticThemesForAndroid: false,
    });

    const root = render({ _config, store });

    expect(root.find('.SuggestedPages-link-themes')).toHaveLength(0);
  });

  it('renders a "themes" link when clientApp is Android and enableFeatureStaticThemesForAndroid is true', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const _config = getFakeConfig({
      enableFeatureStaticThemesForAndroid: true,
    });

    const root = render({ _config, store });

    expect(root.find('.SuggestedPages-link-themes')).toHaveLength(1);
  });

  it('renders a "themes" link when clientApp is not Android', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const _config = getFakeConfig({
      enableFeatureStaticThemesForAndroid: false,
    });

    const root = render({ _config, store });

    expect(root.find('.SuggestedPages-link-themes')).toHaveLength(1);
  });
});
