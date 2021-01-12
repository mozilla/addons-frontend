import * as React from 'react';

import AppBanner, { AppBannerBase } from 'amo/components/AppBanner';
import SiteNotices from 'amo/components/SiteNotices';
import SurveyNotice from 'amo/components/SurveyNotice';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (customProps = {}) => {
    const { location, ...props } = customProps;
    return shallowUntilTarget(<AppBanner {...props} />, AppBannerBase, {
      shallowOptions: createContextWithFakeRouter({
        location: location || createFakeLocation(),
      }),
    });
  };

  it('renders SiteNotices and SurveyNotice components', () => {
    const root = render();

    expect(root.find(SiteNotices)).toHaveLength(1);
    expect(root.find(SurveyNotice)).toHaveLength(1);
  });

  it('passes location to SurveyNotice', () => {
    const location = createFakeLocation({ pathname: '/test/path' });

    const root = render({ location });

    expect(root.find(SurveyNotice)).toHaveProp('location', location);
  });

  it('allows for a custom className', () => {
    const className = 'some-custom-className';

    const root = render({ className });

    expect(root).toHaveClassName('AppBanner');
    expect(root).toHaveClassName(className);
  });
});
